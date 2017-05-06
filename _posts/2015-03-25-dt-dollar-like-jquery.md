---
layout: post
title:  "opDollarを使ったjQuery的なセレクタ"
date:   2015-3-25 2:00:00
categories: dlang
tags: dtips
author: けーさん
---

* content
{:toc}

opDollarを使うと，jQueryの`$(".class")`とか`$("$id")`みたいな
ドル記号を使った感じのアレが実装できるって思いついただけです．

<!--more-->


## How-to

`opDollar`と、それに対応する`opIndex`を書くだけです。

~~~~~~~~~~~~~~d
struct jQuery
{
    void opIndex(Dollar.QuerySelector qs)
    {
        writeln(qs.selector);
    }


    Dollar opDollar() pure nothrow @safe @nogc { return Dollar.init; }


    static struct Dollar
    {
        static struct QuerySelector { string selector; }

        QuerySelector opCall(string str) { return QuerySelector(str); }
    }
}


void main()
{
    jQuery jq;
    jq[$(".foo")];
}
~~~~~~~~~~~~~~~


## さいごに

opDollarはいろいろな用途に使えそうです。(汚くなるけど)
