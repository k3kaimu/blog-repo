---
layout: post
title:  "std.container.arrayからGCの挙動を学ぶ"
date:   2014-9-4 13:00:00
categories: dlang
tags: dtips
author: けーさん
---



* content
{:toc}

dmd 2.066からの新しい仕様として、`@nogc`属性が追加されました。
`@nogc`属性が付加された関数内では、GC heapからメモリを一切確保しないことが静的に保証されます。

ということで、現在メモリ管理やGCに注目が集まっているため、DのGCの挙動を復習するために、`std.container.array`ではどのようにメモリ管理を行っているかをソースコードを読んでみたいと思います。

<!--more-->



## メモリ確保時

`std.container.array.Array!T`型は、内部で`malloc`や`free`、`realloc`といった関数を呼ぶことで、GC heapにメモリを確保せずに、確保したメモリを独自に管理しています。
これらの処理は、`Array`内部で定義されている`Payload`型の`reserve`関数が参考になります。

~~~~~~~d
// reserve
void reserve(size_t elements)
{
    if (elements <= capacity) return;
    immutable sz = elements * T.sizeof;
    static if (hasIndirections!T)       // should use hasPointers instead
    {
        /* Because of the transactional nature of this
         * relative to the garbage collector, ensure no
         * threading bugs by using malloc/copy/free rather
         * than realloc.
         */
        immutable oldLength = length;
        auto newPayload =
            enforce(cast(T*) malloc(sz))[0 .. oldLength];
        // copy old data over to new array
        memcpy(newPayload.ptr, _payload.ptr, T.sizeof * oldLength);
        // Zero out unused capacity to prevent gc from seeing
        // false pointers
        memset(newPayload.ptr + oldLength,
                0,
                (elements - oldLength) * T.sizeof);
        GC.addRange(newPayload.ptr, sz);
        GC.removeRange(_payload.ptr);
        free(_payload.ptr);
        _payload = newPayload;
    }
    else
    {
        /* These can't have pointers, so no need to zero
         * unused region
         */
        auto newPayload =
            enforce(cast(T*) realloc(_payload.ptr, sz))[0 .. length];
        _payload = newPayload;
    }
    _capacity = elements;
}
~~~~~~~

この関数では、`static if`により大きく2つの状況に分けています。

まず、`hasIndirections!T`が真となる場合です。
`std.traits.hasIndirections`は、型がポインタやスライス、連想配列、クラスなどのインスタンスへの参照、デリゲートを持っているかどうかを判定します。
もし、これらを`T`が持っているのであれば、`malloc`で確保した領域にGC管理メモリへの参照が書き込まれるかもしれません。
そのため、`hasIndirecions!T`が真の場合には、`GC.addRange`を用いて確保した領域をGC スキャンの対象とします。
もちろん、`GC.addRange`に領域を追加したからと言って、この領域がGCにより自動で開放されるわけではありません。
このメモリ領域上にあるオブジェクトをGCの回収から守るための処理です。
さらに、`malloc`で確保した領域は未初期化です。
ガベージコレクタによって監視される場合、未初期化のままですとポインタに非nullな値が格納されている状態なので、領域をゼロ初期化しておく必要があります。

対して、`hasIndirecions!T`が偽のときには、GCの監視領域に設定する必要もありません。
それに、ゼロ初期化する必要もありません。
`T.init`で初期化すべきだと思うかもしれませんが、後で配列に要素を追加する際に`std.conv.emplace`を使用するため、ゼロ初期化の必要はありません。


## 開放時

開放時の処理は、同じく`Payload`型のデストラクタを読むのが一番だと思います。

~~~~~d
// Destructor releases array memory
~this()
{
    //Warning: destroy will also destroy class instances.
    //The hasElaborateDestructor protects us here.
    static if (hasElaborateDestructor!T)
        foreach (ref e; _payload)
            .destroy(e);

    static if (hasIndirections!T)
        GC.removeRange(_payload.ptr);

    free(_payload.ptr);
}
~~~~~

デストラクタで行っている処理は、確保したメモリに乗っている値に対してデストラクタの呼び出しと、確保しているメモリ領域をGCのスキャン対象から除くこと、そして最後にメモリを開放することです。

`Array`では、確保しているメモリ領域全てに何らかの意味のある値が常に格納されているので、すべての要素に対してデストラクタの呼び出しを行っています。
もし確保したメモリ領域にまだ未初期化の領域があるのであれば、その領域についてはデストラクタを呼んではいけません。
これは`hasIndirections!T`が真で`memcpy`でゼロ初期化を行っていたとしてもです。


## まとめ

`malloc`や`free`を使ってメモリ確保を行う際は、そのメモリ領域に格納するデータがGCにより管理されたメモリ領域を指している可能性があるか判断しましょう。
その可能性がある場合には、その参照がすべてnullになるように事前にゼロ初期化を行った後、`GC.addRange`により確保した領域をGCのスキャン対象に設定しましょう。
GCのスキャン対象に設定したからといってそのメモリ領域が自動で開放されるわけではなく、この操作は確保したメモリ上のオブジェクトをGCから守るために行います。
また、この必要性があるかどうかの判断は、`std.traits.hasIndirections!T`により行うことができます。

メモリ未初期化な領域にオブジェクトを構築したい場合には`std.conv.emplace`を使用します。

開放処理はメモリ確保処理で行った処理を逆順にこなすだけです。
まず、コンストラクタで初期化済みの要素に対してデストラクタを呼び出します。
GCのスキャン対象にメモリ領域を設定している場合は、`GC.removeRange`を使って解除しておきます。
最後に、`free`関数で確保した領域を開放します。


## 気になったこと

`malloc`や`realloc`の返り値が`null`でないことを保証するために、`enforce`じゃなくて`core.exception.onOutOfMemoryError()`を呼びだせば、`nothrow @nogc`になる気がしますが…。
あと、`RefCounted`も`@nogc`になれば、`Array!T`が`@nogc`で動く気がします。

あと、考えたくはないんですけど、`std.exception.doesPointTo(x, x)`が`true`の場合は`memcpy`とか`realloc`とかはダメです。
`doesPointTo`のリファレンスにも書いてあるとおり、TDPL 7.1.3.5によると自身の内部のポインタを持つような構造体は許されておらず、私達はこのような型があり得ないとして扱ってよいそうなので、このことについてあまり考える必要はありません。
`std.algorithm`の`move`や`swap`は行儀がよいということで。
