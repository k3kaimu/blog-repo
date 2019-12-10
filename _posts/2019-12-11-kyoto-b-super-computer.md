---
layout: post
title:  "京都大学のスーパーコンピュータでD言語を動かす"
categories: blog
tags:  blog
author: けーさん/こまたん
---

この記事は[D言語 Advent Calendar 2019](https://qiita.com/advent-calendar/2019/dlang)と[TUT Advent Calendar 2019](https://adventar.org/calendars/4112)の11日目の記事です．

<!--more-->


* content
{:toc}

## はじめに

ついに今年で豊橋技術科学大学(Toyohashi University of Technology: TUT)に編入学してから6年目になりました．  
TUTアドベントカレンダーへの投稿も[初年の2014年](https://adventar.org/calendars/639)から6年目になります．  
**たぶん6年間毎年投稿している人は私だけです**．  
**すごいやろ！！**


また，D言語を触り始めて大体9年目になると思います．  
D言語アドベントカレンダーにも[初年の2012年](https://qiita.com/advent-calendar/2012/d)から**8年間毎年投稿**していることになります．  
毎年25記事だけという限られた枠に，毎年適当な記事を書いてしまって申し訳ないです．  
**でもすごいやろ！！**


去年のD言語アドベントカレンダーには[クラスタ計算機用ジョブ投入ライブラリ]({{ site.baseurl }}{% post_url 2018-12-18-dlang-advcal %})という記事を書きました．  
内容は，技科大のクラスタ計算機の上でD言語を動かすライブラリの紹介です．


今年は同じライブラリを使って**京都大学のスーパーコンピュータで**D言語のプログラムを動かす話を書きます．


## 京都大学のスーパーコンピュータについて

京都大学には正真正銘のスーパーコンピュータが存在します．  
やはり旧帝大は違いますね．．．  


しかも，システムは一つだけではなく，三つの特色が異なるシステムがあります．  
その中で，主にCPUでのタスク向きなものがLaurel 2（システムB）です．  
詳しくは[京都大学情報環境機構のページ](https://www.iimc.kyoto-u.ac.jp/ja/services/comp/supercomputer/)を参照してください．  

システムBでは，850個の計算ノードのすべてにIntelのBroadwellの18コアXeon CPUが二つ搭載されています．  
つまり，**システムB全体では30600 ものCPUコアがあります**．  
すごい．  


ただし，技科大全体として利用できるのは，最大でもそのうちの47ノード分の1692 CPUコアだけです．  
また，各ジョブが利用できる最大値は26ノード分の936 CPUコアが最大です．
これだけでも十分ですけどね．


また，なぜか技科大からの利用者はほとんど見かけないので，いつも空いています．  
これからの卒論・修論の追い込み時期におすすめです．  



## ジョブスケジューラなど

PBS Professionalです．  
新しい技科大のクラスタ計算機と同じです．


ただし，[ジョブスクリプトにおけるリソース量の指定などのオプションは独自の変更が加えられています](https://web.kudpc.kyoto-u.ac.jp/manual/ja/run/systembc#option_modified)．  
**どうして．．．**


また，技科大のクラスタ計算機と違ってDockerやSingularityコンテナの上でジョブを動かす，ということはないです．  
なので，何も気にせずLinuxbrewなどを使って環境構築していいと思います．



## D言語のコンパイラなどのインストール

これこそ**人生最良の行動**です．

[異国カラス（@outlandkarasu）](https://twitter.com/outlandkarasu)さんのD言語Advent Calendar 2019の2日目の記事である[D言語環境構築 2019年版](https://qiita.com/outlandkarasu@github/items/faa555d5c1d1d19a8fa4)を読みましょう！


## 私のライブラリ[TUT-HPCLIB4D](https://github.com/k3kaimu/TUT-HPCLIB4D)

技科大のクラスタ計算機システムが今年の夏に入替りにより一時期使えなくなる，ということで4月頃から京大のスパコンを利用し始めました．  
このライブラリも今年の4月4日には京大スパコンでアレイジョブが動くようにしました．  


たとえば，次のような2変数の総当りで処理するプログラムをスパコン上で並列処理したいとします．


```d
import std.stdio;

void main()
{
    // 2変数を総当りして128回表示する
    foreach(i; 0 .. 32)
        foreach(s; ["a", "bb", "ccc", "dddd"])
            writefln("Hello, dlang! %s %s", i, s);
}
```

私のライブラリを使って並列化したソースファイルが次の通りです．  


```d
import std.stdio;
import tuthpc.taskqueue;

void main()
{
    // スパコンの各CPUで実行するジョブのリスト
    auto list = new MultiTaskList!void();

    // 2変数を総当りして128個のジョブ生成
    foreach(i; 0 .. 32)
        foreach(s; ["a", "bb", "ccc", "dddd"])
            list.append!writefln("Hello, TUTHPCLib4D! %s %s", i, s);

    // スパコンで動かすとジョブ投入、それ以外ではスレッド並列実行
    list.run();
}
```

変わるのは，`auto list = ...;`と`list.append!writeln...`と`list.run()`の部分です．  
**それ以外は変更する必要がありません**．  

しかも，スパコン以外の環境で動かせばスレッド並列で処理してくれます．  
**便利でしょ？？**  

また，[C++からの利用や](https://github.com/k3kaimu/TUT-HPCLIB4D/blob/master/examples/link_with_cxx2/cxxsrc/func.cpp)，[RubyやPythonなどからの利用]({{ site.baseurl }}{% post_url 2019-03-10-qsubarray %})も可能です．


どのようにジョブを投入して，どのようにジョブを実行しているかなどの詳しい紹介は[去年のD言語アドベントカレンダーの記事「クラスタ計算機用ジョブ投入ライブラリ」]({{ site.baseurl }}{% post_url 2018-12-18-dlang-advcal %})に書いています．


## まとめ

D言語ユーザーと技科大生の両方をターゲットに記事を書いた結果，よくわからない中途半端な記事になりました．




## 宣伝

某Y先生の`qwatch.pl`コマンドの代替コマンドを**D言語で**作りました．
詳しくは以下のリポジトリのREADME.mdを読んでください．

[GitHubリポジトリはここ](https://github.com/k3kaimu/cluster-tools)

インストールは以下のようにできます．

```sh
$ wget https://github.com/k3kaimu/cluster-tools/releases/latest/download/qshow
$ chmod +x qshow
```

一応，`qwatch.pl`との差別化として**ユーザーが出力フォーマットを自由に変更できる**ようになっています．  
自分が確認したい情報だけを表示できるので，出力結果がごちゃごちゃしなくなると思います．

また，`--noheader`オプションとフォーマット指定を組み合わせると，このコマンドの出力を他のシェルスクリプトやプログラムで処理する際の利便性が向上すると思われます．  
たとえば，以下の例では各ノードで動いているジョブのユーザーの一覧をカンマ区切りで出力しています．

```sh
$ qshow  --noheader -n --nodefmt='%name:s,%users:-(%(%s%),%)'
xsnd00,c222222,aa000
xsnd01,c222222,b111111,aa000
xsnd02,b111111,d333333,aa000
xsnd03,b111111
xsnd04,b111111
xsnd05,c222222,aa000
xsnd06,c222222,aa000
xsnd07,c222222,b111111,aa000
xsnd08,c222222,b111111,aa000
xsnd09,d333333
xsnd10,c222222,aa000
xsnd11,c222222,aa000
xsnd12,c222222,aa000
xsnd13,c222222,aa000
```

ただ，こいつは京大スパコンではうごきません．．．
