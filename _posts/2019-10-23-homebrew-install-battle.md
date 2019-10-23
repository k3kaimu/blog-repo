---
layout: post
title:  "TUT新クラスタの環境を構築した"
categories: blog
tags:  blog
author: けーさん
---


豊橋技科大の新クラスタシステムが2019年9月中旬ごろから運用が開始されました．
少し遅くなりましたが，Homebrewの環境構築などに目処がついたので，まとめておこうと思います．


<!--more-->


## コンテナ

DockerとSingularityが使えますが，セキュリティ的な理由からか，ユーザが作ったコンテナイメージは利用できません．

そのため，現状はNGC（NVIDIA GPU Cloud）に上がっているイメージを利用することになると思います．

私のおすすめは `nvcr.io/nvidia/tensorflow:19.07-py3` です．
このイメージではgitなどの基本的な開発環境が整っていることを確認しています．
また，このイメージをDockerで起動すれば `/opt/pbs/bin` の中に入っている `qsub` や `pbsnodes` が実行できます．
一方で，Singularityであればこれらのバイナリを実行してもエラーになります．
そのため，計算ノードからジョブを投入したい場合にはDockerでイメージを起動し，そうでない場合はSingularityで起動するといいと思います．

また，インタラクティブジョブで計算ノードに入る機会が増えたので，以下のaliasをbashrcに書いておくといいと思います（細部はご自由に）．

```sh
alias qallocnode='qsub -I -q wSrchq -l select=1:ncpus=2:mem=10g -v DOCKER_IMAGE=nvcr.io/nvidia/tensorflow:19.07-py3 -- bash'
```



## Homebrew

`nvcr.io/nvidia/tensorflow:19.07-py3` であればHomebrewでいろいろなパッケージが入ることを確認しています．

新クラスタでの注意点としては，窓口サーバ（xdev）と計算ノードのOSが異なるということです．
つまり，窓口サーバと計算ノードの両方にHomebrewを入れるのであれば，それぞれの環境を分けるべきでしょう．
そのため，基本的には従来のように `/work/$USER/` 以下に環境を構築しますが，窓口サーバ用は（一例として） `/work/$USER/xdev/` 以下に環境を構築し，計算ノード用は `/work/$USER/xsnd/` 以下に環境を構築すべきだと思います．

よって，窓口サーバでは次のようにgitを使ってHomebrewをインストールします．
（計算ノードのみにHomebrewの環境を構築するのであれば，窓口サーバでのHomebrewのインストールは不要です）

```sh
$ cd /work/$USER/
$ git clone https://github.com/Homebrew/brew xdev/.linuxbrew/Homebrew
$ cd xdev
$ mkdir .linuxbrew/bin 
$ ln -s ../Homebrew/bin/brew .linuxbrew/bin
```

計算ノード用のHomebrewも同様にgitを使って `/work/%USER/xsnd` 以下に入れておきましょう．

そして， `~/.bashrc` などでホスト名に `xdev` が含まれているかそうでないかでどちらの環境にパスを通すか選択するといいと思います．
私の場合は次のような記述を `~/.bashrc` に記載しています．

```sh
if hostname | grep 'dev' > /dev/null
then
  # development node
  export LINUXBREW_ROOT_PATH=$HOME/work/xdev
else
  # compute node
  export LINUXBREW_ROOT_PATH=$HOME/work/xsnd
fi

export HOMEBREW_CACHE=$LINUXBREW_ROOT_PATH/.cache
eval $($LINUXBREW_ROOT_PATH/.linuxbrew/bin/brew shellenv)
```

ここまでできれば，あとは窓口サーバ上や，インタラクティブジョブで入った計算ノード上で `brew` コマンドを使い環境構築しましょう．


## コンパイル・ビルドはどこでやる？

窓口サーバと計算ノードの環境が異なるため，プログラムのコンパイル・ビルドは計算ノードで行うことが望ましいでしょう．



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

未だに成功しておらず．
電気系の学生には難しいよ．．．


## 自作ライブラリ

[自作ライブラリ](https://github.com/k3kaimu/TUT-HPCLIB4D)も新クラスタへ対応しました．
ただし，まだ依存ジョブには対応できてません．

そのうちインストール方法もちゃんと書き直します．


## クラスタの使用状況の確認

`pbsnodes -aSj` が便利

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

