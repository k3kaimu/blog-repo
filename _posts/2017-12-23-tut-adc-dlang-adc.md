---
layout: post
title:  "研究室でD言語を使っているお話（今年一年のまとめ）"
categories: blog
tags:  blog
author: けーさん
---

## はじめに

この記事は、[TUT Advent Calendar](https://adventar.org/calendars/2335)の22日目の記事であり、さらに[D言語 Advent Calendar](https://qiita.com/advent-calendar/2017/dlang)の23日目の記事です。

私は某国立大学の大学院の電気・電子情報系学科に所属していて、来年からは博士課程に進学する予定です。
研究の分野は無線通信で、特に「全二重通信」と呼ばれる次世代の無線通信方式についてディジタル信号処理の観点から研究しています。

今回の記事では、私が今年一年間で研究室にてD言語で作った成果について紹介します。


## ベースバンド信号シミュレータ

無現在のディジタル線通信は数百MHzから数GHz以上の周波数の電波を使用します。
この電波に載せる信号をシミュレーションするソフトウェアをベースバンド信号シミュレータといいます。
オープンソースのベースバンド信号シミュレータ系ライブラリのといえば、GNU RadioやIT++が有名だと思います。
しかし、GNU Radioは拡張性が良いとは言えず、IT++はここ数年全く保守されていません。
あと、GNU RadioはPythonかC++で、IT++はC++で記述できますが、やっぱりD言語で研究したいです。
ということで、ベースバンド信号シミュレータ系ライブラリをD言語で作りました。
論文の関係上まだGitHubにはソースコードを上げていませんが、現在IEEE Trans. on Wireless Communicationsに出している論文がAcceptされ次第ソースコードの公開をします。
ちなみに、このライブラリを使用してシミュレーションした結果は2017年3月にサンフランシスコで開催された国際会議IEEE WCNC (Wireless Communications and Networking Conference)にて発表しました。
[そのときの会議論文はこちら](http://ieeexplore.ieee.org/document/7925765/)（ちゃんと論文中にシミュレータがD言語製であると記述しています！）。


## ソフトウェア無線（USRP）用ライブラリ

[リポジトリはこちら](https://github.com/k3kaimu/uhd4d)

こちらも無線通信関係です。
USRPというソフトウェア無線用RFフロントエンド用のD言語ライブラリを作りました。
ソフトウェア無線とは、ソフトウェアによってベースバンド信号処理を行い、その信号を電波に載せたり、逆に電波をベースバンド信号に変換しソフトウェアで受信処理を行う無線機です。
USRPはソフトウェアによって作られたベースバンド信号を電波に載せたり、電波からベースバンド信号に変換する装置で、一つ20万円から100万円くらいします。
USRPはGNU Radioや[UHD](https://github.com/EttusResearch/uhd)というC++用のライブラリを用いて制御でき、実際に弊研究室では従来までこれらを利用してC++で書かれたソフトウェアでベースバンド信号を生成したり、受信処理を記述していましたが、コードが煩雑になってしまってました。

やっぱりD言語でソフトウェア無線できると嬉しいので、研究の合間にちまちまコードを書いていました。
このライブラリでは、UHDが公開しているC言語用APIを利用して、UHDよりも扱いやすいように作っています。
[このライブラリはすでにGitHubにて公開しています](https://github.com/k3kaimu/uhd4d)。

また、このライブラリを用いて実際にUSRPを3台制御するデモを2017年11月29,30日、12月1日の3日間開催されたマイクロウェーブ展にて展示してきました。
当日の様子はこんな感じです。

<blockquote class="twitter-tweet" data-lang="ja"><p lang="ja" dir="ltr">実機の展示はこんな感じです。D言語で書かれたソフトウェアで信号処理をして無線機から高周波信号を出しています <a href="https://twitter.com/hashtag/dlang?src=hash&amp;ref_src=twsrc%5Etfw">#dlang</a> <a href="https://t.co/LhyuYYm0L4">pic.twitter.com/LhyuYYm0L4</a></p>&mdash; けーさん@緊急復活 (@k3k0ma) <a href="https://twitter.com/k3k0ma/status/935804348575113218?ref_src=twsrc%5Etfw">2017年11月29日</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


## クラスタ計算機用ジョブ投入ライブラリ

[リポジトリはこちら](https://github.com/k3kaimu/TUT-HPCLIB4D)

豊橋技術科学大学には10コアのXeonが二つ載ったノードが30ノード繋がったクラスタ計算機が設置されており、学生が研究や学習用途に自由に利用することができます。
私も最近ではシミュレーション条件をたくさん振ったり、乱数のシードを変えて試行回数をたくさん稼いでシミュレーションをしているので、どうしてもクラスタ計算機のようなHPC環境がないとシミュレーション時間がかかってしまいます。

しかし、クラスタ計算機のジョブスケジューラにジョブを投げるために投入用スクリプトを書かないといけないのが少しめんどくさいです。
たとえば、変数tを1から100まで変えてプログラムprogを走らせるジョブの投入スクリプトは次のような感じになります。

`````bash
#PBS -l nodes=1:ppn=1
#PBS -t 1-100
#PBS -q wLrchq

cd $PBS_O_WORKDIR
./prog ${PBS_ARRAYID}
`````

このように、ジョブスケジューラの機能だけだと、イテレートする変数が整数一つだけで、たとえば`foreach(e1; param1) foreach(e2; param2) {...}`のように複数パラメータを総当りしてシミュレーションすることも簡単にはできません。
また、同じソースコードで、手元のPC上ではCPU個数分だけ並列動作し、クラスタ計算機では複数ノードで並列処理されるようなコードを書くのも困難でしょう。

私が作った[クラスタ計算機用ジョブ投入ライブラリ](https://github.com/k3kaimu/TUT-HPCLIB4D)では、以下のような感じで簡単にD言語からジョブ投入できます。

```d
import std.stdio;
import tuthpc.taskqueue;

void main()
{
    JobEnvironment env;
    auto list = new MultiTaskList();

    // 2変数を総当りして256個のジョブ生成
    foreach(i; 0 .. 16)
        foreach(j; 0 .. 16)
            list.append!writefln("Hello, TUTHPCLib4D! %s", i);

    // クラスタ計算機で動かすとジョブ投入、それ以外では並列実行
    run(list, env);
}
```

実行もパッケージマネージャdubを使えば`dub`だけで、ローカルでもクラスタ計算機でも動きます。
また、クラスタ計算機上のN個のノードで各M個のコアを専有したい場合には`dub -- --th:g=M --th:m=N`と実行すればその通りにジョブ投入されます。

また、[C言語から扱う場合](https://github.com/k3kaimu/TUT-HPCLIB4D/tree/master/examples/link_with_c)や[C++から扱う場合のサンプルコード](https://github.com/k3kaimu/TUT-HPCLIB4D/tree/master/examples/link_with_cxx)もリポジトリに添付しています。
このライブラリはわりと便利で実用的なので技科大生でクラスタ計算機利用している人にはおすすめです。


## まとめ

振り返ってみると、2017年はわりといろいろと作ってた感じでした。
来年にはこの記事の最初に紹介したシミュレータ用のライブラリも公開できると思いますので、そのときにはまた記事を書きたいと思います。
