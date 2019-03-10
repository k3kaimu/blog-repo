---
layout: post
title:  "クラスタ計算機にジョブを投入する便利コマンドqsubarray"
categories: blog
tags:  blog
author: けーさん
---

クラスタ計算機にジョブを投入する際に`qsub`というコマンドを使いますが，
このコマンドはかなり使いづらく，クラスタ計算機をよく使う人はみなさん自分で工夫をされていると思います．

今回は様々な言語からアレイジョブを簡単に投入できるようになる`qsubarray`というコマンドを紹介します．

<!--more-->


## インストール方法

ビルドするためにD言語のコンパイラdmdとパッケージマネージャdubが必要になります．

すでにLinuxbrewの環境を構築済みな場合は以下のコマンドで二つをインストールできます．

```sh
$ brew install dmd dub
```

Linuxbrewの環境がない場合には，D言語の公式インストールスクリプトを用いてdmdとdubを入れることができます．

```sh
$ curl -fsS https://dlang.org/install.sh | bash -s dmd
$ source ~/dlang/dmd-<version>/activate
```

dmdとdubが入れば，gitで[このリポジトリ](https://github.com/k3kaimu/TUT-HPCLIB4D)をcloneしてqsubarrayをビルドします．

```sh
$ git clone git@github.com:k3kaimu/TUT-HPCLIB4D.git
$ cd TUT-HPCLIB4D/examples/qsubarray
$ dub build
```

次のように，ビルドしたバイナリが入っているディレクトリにパスを通しておきます．
適宜`.bash_profile`や`.bashrc`に記載してください．

```sh
$ export PATH=$PATH:<dir of TUT-HPCLIB4D>/examples/qsubarray
```

`which qsubarray`でqsubarrayのディレクトリへのパスが表示されたら大丈夫です．


## 使い方

ここでは例として次のような100回Hello, worldするPythonプログラムをアレイジョブとして投入したいと思います．

```py
for i in range(100):
    print("Hello, world! This is {0}th task.".format(i))
```

これを100個のジョブに分けて投入するには次のようなスクリプトに書き換えます．


```py
# jobscript.py

# 100個のジョブを投げることを知らせる．必ずflushする
print("TUTHPCLIB4D:submit:100", flush=True)

# 標準入力から整数を一つ読む，この値は-1,0,...,99の値
index = int(input())

if index >= 0 and index < 100:
    # indexが正の整数で100未満のときのみ実行
    print("Hello, world! This is {0}th task.".format(index))
```

そして次のようなコマンドでジョブの投入をします．
ここでは，2ノード(40CPU)を専有するように投げる例を示します．

```sh
$ qsubarray --th:g=20 --th:m=2 python jobscript.py
```


## qsubarrayの動作原理

以下にqsubarrayの動作原理を説明しますが，説明をわかりやすくするために，「タスク」と「ジョブ」という言葉を定義しておきます．

+ タスク：実際に並列実行したい処理の最小単位．
+ ジョブ：クラスタ計算機のジョブスケジューラに投入されるアレイジョブを構成しているもの．


つまり，タスクはそれ以上分割できませんが，ジョブは複数のタスクへ分割できます．
逆に，ジョブは複数のタスクから構成されており，複数のジョブからアレイジョブが構成されます．


### アレイジョブの投入

例に示したスクリプトを見ればわかるように，qsubarrayは投入するプログラムと標準入出力で情報をやり取りします．

具体的には，次のようなコマンドが投入されたとします．

ここで，`qsubarray_args...`は`--th:g=20 --th:m=2`のようにqsubarrayに渡される引数であり，各引数は必ず一つか二つのハイフン`-`から始まっています．

```sh
$ qsubarray qsubarray_args... task_cmds...
```

このコマンドが実行されると，qsubarrayが起動します．

開発ノード上で起動したqsubarrayは`task_cmds...`を一回だけ開発ノード上で動かし，パイプで`task_cmds...`の標準出力を監視します．

`task_cmds...`は次のような文字列を標準出力に出力し，標準入力を待機します．

```
TUTHPCLIB4D:submit:123
```

この文字列の意味は「123個のタスクがあるのでアレイジョブで適当に投げてください」という意味です．

qsubarrayはこの文字列を標準入力で受け取り，123個のタスクから複数のジョブを生成し，それをアレイジョブとして`qsub`コマンドを使って投入します．

アレイジョブの投入後，qsubarrayは標準出力に`-1`を出力します．

すると，標準入力を待機していた`task_cmds...`は`-1`を受け取ります．

`-1`は`[0, 123)`の範囲外なので`task_cmds...`何も実行せず，そのまま終了するか次のジョブの準備(もう一度`TUTHPCLIB4D:submit:<N>`の出力)に移り，最終的には終了します．


### ジョブ/タスクの実行

次に，投入された123個のタスクがどのように実行されるか説明します．

アレイジョブで投入された複数のジョブは次のように，開発ノード上で実行されたときと全く同じように計算ノードで実行されます．

```sh
$ qsubarray qsubarray_args... task_cmds...
```

ただし，qsubarrayは自身が実行されている環境が開発ノードか計算ノードかを判断できます（実際にホスト名で確認しています）．

まず，qsubarrayは`task_cmds...`を実行し，`TUTHPCLIB4D:submit:123`の一行を読みます（が実行ノードではこの値を使って何かをするわけではありません）．

その後，qsubarrayは`qsub`コマンドが設定した環境変数`PBS_ARRAYID`を読み，その値を標準出力に出力し，`task_cmds...`に渡します．

`task_cmds...`はその値を標準入力から受け取って，その値に対応するタスクを実行します．



## その他例など

C++, D, Pythonからの利用例を示します．

Pythonの例がもっともコメントが付いていてわかりやすいと思います．

+ [C++](https://github.com/k3kaimu/TUT-HPCLIB4D/blob/master/examples/qsubarray/program/test.cpp)
+ [D](https://github.com/k3kaimu/TUT-HPCLIB4D/blob/master/examples/qsubarray/program/test.d)
+ [Python](https://github.com/k3kaimu/TUT-HPCLIB4D/blob/master/examples/qsubarray/program/test.py)

また，qsubarrayへ渡すオプション（`--th:g=20`などのやつ）は[README](https://github.com/k3kaimu/TUT-HPCLIB4D/blob/master/readme.md)を読んでください．

よく使うオプションの使用例を以下に示します．

```sh
# cmds...がどれだけタスクを生成したとしても100個のジョブからなるアレイジョブを投げる
# 100個よりタスクの数が多いときはラウンドロビン的に100個のジョブにタスクが割り当てられる
$ qsubarray --th:m=100 cmds...

# 7つのタスクを1つのジョブにまとめて投入する
# 例：100個タスクがあれば，15個の7CPU専有するジョブが出来上がる
$ qsubarray --th:g=7 cmds...

# 各タスクは4スレッド並列になっており，それを5つまとめて1つのジョブにする
# つまり，5タスクで1ジョブであり，1ジョブあたり1ノードを専有
$ qsubarray --th:p=4 --th:g=5 cmds...

# 1タスクが4スレッド使うが，最大でも専有するのは2個のノードに抑えたい
# このとき，1ノードを専有するジョブが2つ投入される
$ qsubarray --th:p=4 --th:g=5 --th:m=2 cmds...
```
