---
layout: post
title:  "TUT新クラスタの環境を構築した"
categories: blog
tags:  blog
author: けーさん
---


豊橋技科大の新クラスタシステムが2019年9月中旬ごろから運用が開始されました．
少し遅くなりましたが，Homebrewの環境構築などに目処がついたので，まとめておこうと思います．

（2019年10月30日，12月8日に書き直しました）


<!--more-->


## コンテナ

DockerとSingularityが使えますが，セキュリティ的な理由からか，ユーザが作ったコンテナイメージは利用できません．

おすすめのイメージは `imc.tut.ac.jp/centos7:2019.09` です．
このイメージは窓口サーバと同じような環境が再現されており，またgitなどの基本的な開発環境が整っています．
また，このイメージをDockerで起動すれば `/opt/pbs/bin` の中に入っている `qsub` や `pbsnodes` が実行できます．
一方で，Singularityであればこれらのバイナリを実行してもエラーになります．
そのため，計算ノードからジョブを投入したい場合にはDockerでイメージを起動し，そうでない場合はSingularityで起動するといいと思います．

また，以下のaliasをbashrcに書いておくといいと思います（細部はご自由に）．

```sh
alias qalloccpu='qsub -I -q wEduq -l select=1:ncpus=1:mem=6gb -v DOCKER_IMAGE=imc.tut.ac.jp/centos7:2019.09 -- bash'
alias qallocnode='qsub -I -q wSrchq -l select=1:ncpus=28:mem=192gb -v DOCKER_IMAGE=imc.tut.ac.jp/centos7:2019.09 -- bash'
```



## Homebrew

窓口サーバや，計算ノードの `imc.tut.ac.jp/centos7:2019.09` のイメージであればHomebrewでいろいろなパッケージが入ることを確認しています．

新クラスタでの注意点としては，利用するコンテナイメージによっては窓口サーバ（xdev）と計算ノードのOSが異なるということです．
つまり，計算ノードで `imc.tut.ac.jp/centos7:2019.09` 以外のイメージを利用するのであれば，窓口サーバと計算ノードそれぞれの環境を分けるべきでしょう．

まず，窓口サーバでは次のようにgitを使ってHomebrewをインストールします．
（計算ノードのみにHomebrewの環境を構築するのであれば，窓口サーバでのHomebrewのインストールは不要です）

```sh
$ cd /work/$USER/
$ git clone https://github.com/Homebrew/brew .linuxbrew/Homebrew
$ mkdir .linuxbrew/bin 
$ ln -s ../Homebrew/bin/brew .linuxbrew/bin
```

計算ノードで `imc.tut.ac.jp/centos7:2019.09` を利用するのであれば，計算ノードでも窓口サーバ用のHomebrewを利用すれば大丈夫でしょう．
その場合はbashrcに以下のような記述を書いておけばいいでしょう．

```sh
export LINUXBREW_ROOT=/work/$USER
export HOMEBREW_TEMP=/work/k143229/tmp
export HOMEBREW_CACHE=$LINUXBREW_ROOT/.cache
eval $($LINUXBREW_ROOT/.linuxbrew/bin/brew shellenv)
```

もし，計算ノードで別のイメージを利用するのであれば，他のディレクトリにHomebrewを入れ，bashrcでは以下のように切り替えればいいでしょう．

```sh
if hostname | grep 'dev' > /dev/null
then
  # development node
  export LINUXBREW_ROOT=/work/$USER
else
  # compute node
  export LINUXBREW_ROOT=/work/$USER/xsnd
fi

export HOMEBREW_TEMP=/work/k143229/tmp
export HOMEBREW_CACHE=$LINUXBREW_ROOT/.cache
eval $($LINUXBREW_ROOT/.linuxbrew/bin/brew shellenv)
```

ここまでできれば，あとは窓口サーバ上や，インタラクティブジョブで入った計算ノード上で `brew` コマンドを使い環境構築しましょう．


## コンパイル・ビルドはどこでやる？

窓口サーバと計算ノードの環境が異なるため，プログラムのコンパイル・ビルドは計算ノードで行うことが望ましいでしょう．

`imc.tut.ac.jp/centos7:2019.09` を利用するのであれば窓口サーバでコンパイル・ビルドしていいと思います．



## コンテナ内部からのqsub

すでに書きましたが，（一部の？）イメージのDockerコンテナからは `/opt/pbs/bin` が使えるようです．
そのため，ここへのパスを追加すれば窓口サーバと同じように計算ノードから `qsub` が使えます．



## 旧・新クラスタのジョブスクリプトの違い

旧クラスタはTorqueで，新クラスタはPBSProというものらしい（本当？）．
そういうこともあり，ジョブスクリプトのオプションが少し異なります．

* 計算リソースを指示する `-l nodes=1:ppn=2` というような部分は `-l select=1:ncpus=2` に変わりました
* アレイジョブは `-t` から `-J` に変わりました
* アレイジョブのインデックスは環境変数名が `PBS_ARRAYID` から `PBS_ARRAY_INDEX` に変わりました．
* コンテナイメージを `-v DOCKER_IMAGE=` か `-v SINGULARITY_IMAGE=` で指定する必要があります．

たぶんその他にも旧クラスタと異なる点がありますが，私の用途的にはこれらの点を気にすれば問題ありませんでした．


## VSCodeのRemote Development

（この節は12月8日に書き直しました）

当初は窓口サーバへのsshのポート転送が許可されていないため，VS CodeのRemote Development拡張機能が使えませんでした．
この件をIMCに問い合わせたところ，対応していただけましたので，今では利用できます．

ただし注意点として，VS Codeの設定`"remote.SSH.lockfilesInTmp` を `true` にしないと正常に起動できません．


## D言語コンパイラなど

公式の[インストールスクリプト](https://dlang.org/install.html)が便利です．

以下のようにしてスクリプトファイルを保存しておきます．
また，`~/dlang` に `/work/$USER/dlang` のリンクを貼っておけばいいでしょう．

```sh
$ mkdir -p /work/$USER/dlang
$ wget https://dlang.org/install.sh -O /work/$USER/dlang/install.sh
$ ln -s /work/$USER/dlang ~/
```

あとは次のようにしてコンパイラを入れます．

```sh
$ ~/dlang/install.sh dmd-2.088.1
$ ~/dlang/install.sh ldc-1.18.0
```

また，bashrcには以下の記述を書いておきましょう．

```sh
_O_PS1_=$PS1
source $(~/dlang/install.sh dmd-2.088.1 -a)
source $(~/dlang/install.sh ldc-1.18.0 -a)
PS1=$_O_PS1_
```


## 自作ライブラリ

[自作ライブラリ](https://github.com/k3kaimu/TUT-HPCLIB4D)も新クラスタへ対応しました．
ただし，まだ依存ジョブには対応できてません．

そのうちインストール方法もちゃんと書き直します．


## クラスタの使用状況の確認

`pbsnodes -aSj` が便利です．
bashrcに`alias qwatch='pbsnodes -aSj'`と記述しておけばいいでしょう．

```sh
$ pbsnodes -aSj
                                                        mem       ncpus   nmics   ngpus
vnode           state           njobs   run   susp      f/t        f/t     f/t     f/t   jobs
--------------- --------------- ------ ----- ------ ------------ ------- ------- ------- -------
xsnd00          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd01          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd02          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd03          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd04          free                 1     1      0  160gb/192gb   27/28     0/0     2/2 4875
xsnd05          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd06          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd07          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd08          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd09          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd10          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd11          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd12          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
xsnd13          free                 0     0      0  192gb/192gb   28/28     0/0     2/2 --
```



## その他

VPNを繋がなくても学外からxdevに接続できるようになってうれしい．

`imc.tut.ac.jp/centos7:2019.09` が追加されたのでだいぶ楽に使えるようになったと思う．

