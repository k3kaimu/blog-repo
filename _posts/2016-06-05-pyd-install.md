---
layout: post
title:  "Mac OSX El CapitanでPyDを使おうとしてはまった話"
date:   2016-6-5 16:16:00
categories: dlang
tags: dtips
---

* content
{:toc}

タイトルの通り，使おうとしたらハマったので書いておきます．

<!--more-->


## PyDとは

PyDとは，D言語からPythonを触ることのできる素晴らしいソフトウェアです．

[PyD](https://github.com/ariovistus/pyd/)


## El Capitanでのエラー その1

El Capitanで`matplotlib`などの追加でインストールしたモジュールをインポートしようとすると，次のエラーが出て詰みます．

~~~~~
exceptions.ImportError: dlopen(/usr/local/Cellar/python/2.7.11/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-dynload/_io.so, 2): Symbol not found: __PyCodecInfo_GetIncrementalDecoder
  Referenced from: /usr/local/Cellar/python/2.7.11/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-dynload/_io.so
  Expected in: flat namespace
 in /usr/local/Cellar/python/2.7.11/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-dynload/_io.so
~~~~~

このエラーでググると，El Capitanで標準で入っているPythonのバージョンである2.7.11が悪いらしいです．

[Homebrewで入るPython2.7.11でDjangoのrunserverがコケることに対応したメモ](http://qiita.com/zaburo/items/802423b0d2d63b0cb456)

とりあえず，上記の通りに2.7.10を入れると良いです．


## エラー その2

けど，それでも次のようなエラーが出ます．

~~~~~
exceptions.RuntimeError: Python is not installed as a framework. The Mac OS X backend will not be able to function correctly if Python is not installed as a framework. See the Python documentation for more information on installing Python as a framework on Mac OS X. Please either reinstall Python as a framework, or try one of the other backends. If you are Working with Matplotlib in a virtual enviroment see 'Working with Matplotlib in Virtual environments' in the Matplotlib FAQ
~~~~~

これもググると，次のような記事がありました．

[Python 3.3でmatplitlibとpylabを使おうとしたら RuntimeError: Python is not installed as a frameworkというエラーが発生したときの解決方法](http://qiita.com/katryo/items/918667f28301fdec89ba)

というわけで，上記記事を参考にして再度挑戦すると，今度はちゃんとグラフが表示されました！！


## まとめ

El CapitanでPython 2.7.11は使うな！
