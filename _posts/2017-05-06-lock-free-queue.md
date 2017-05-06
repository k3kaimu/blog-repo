---
layout: post
title:  "ロックフリーキューのパフォーマンス"
categories: dlang
tags:  dtips
author: けーさん
---

* content
{:toc}

dubで提供されている[ロックフリーなパッケージ`lock-free`](https://github.com/MartinNowak/lock-free)のベンチマークを取ってみました．

<!--more-->

ベンチマークを取るのに使ったコードはこんな感じです．
コンパイラは`ldc 1.1.0 (v2.071.2)`，計測したPCはMBP Early 2015 Intel Core i5 2.9GHzです．

下のコードでは，`inserter`と`consumer`を別々のスレッドで実行します．
`inserter`ではキューに値を`N == 1024*1024`個入れて，`consumer`では並行してキューから値を取り出していきます．

~~~~~~~~~~d
#!/usr/bin/env dub --compiler=ldmd2 --build=release --single
/+ dub.json:
    {
        "name": "queueBench",
        "dependencies":{
            "lock-free": "~>0.1.2"
        }
    }
+/
import std.concurrency;
import std.datetime;
import std.stdio;
import lock_free.dlist;

enum size_t N = 1024*1024;

alias Queue = AtomicDList!int;
//alias Queue = SyncedDList!int;

// 突っ込む関数
void inserter(shared Queue list) {
    StopWatch sw;
    sw.start();

    // ツッコめ！
    foreach(uint i; 0 .. N)
        list.pushBack(i);

    sw.stop();
    writeln(sw.peek.usecs * 1024 / N);
    writeln(1e9 / (sw.peek.usecs * 1024 / N), "[elem/sec]");
}

// 抜き取る関数
void consumer(shared Queue list) {
    StopWatch sw;
    sw.start();
    size_t cnt;

    // キューからN個抜きとる
    while(cnt < N){
        auto p = list.popFront();

        // キューから抜き取れたら，カウント増やす
        if(p !is null) ++cnt;
    }

    sw.stop();
    writeln(sw.peek.usecs * 1024 / N);
    writeln(1e9 / (sw.peek.usecs * 1024 / N), "[elem/sec]");
}

void main() {
    auto list = new shared Queue;

    spawn(&inserter, list);
    consumer(list);
}

~~~~~~~~~~~

結果は，秒速400万要素くらいは突っ込めるみたいです．
キューに突っ込むときのほうが処理的に重いようで，キューから取り出す処理はもう少し速度が出そうです．

ちなみに，`alias Queue = ...`の部分の2行のコメントアウトを入れ替えると，ロックするキューのベンチマークができます．

速度的にはロックフリーのほうが50倍くらい速いです．
いいですねロックフリー！
自分では絶対書けませんが．．．