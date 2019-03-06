---
layout: post
title:  "LinuxbrewをTUTクラスタ計算機に入れる（2019年3月）"
categories: blog
tags:  blog
author: けーさん
---



## はじめに

この記事の内容は2019年3月5日のお話．

<!--more-->

Linuxbrewは頻繁に大きな変更が加わるため，時期によってはここに書いてある方法では入らない可能性がある．

まず，2018年10月の以下のコミットによりシステムのgitやcurlが古ければ **gitやcurlの強制インストール** が発生するようになった．

* [brew: check system-provided curl and git on Linux, Homebrew/brew@7aa9956](https://github.com/Homebrew/brew/commit/7aa995693479992a76e19a15132843d6fdf765f5)

`brew install git` や `brew install curl` が正常に走れば問題はない．

しかし，TUTのクラスタ計算機はgitやgccのバージョンが古すぎるため，`brew install git`が完走しない．

具体的には，Linuxbrewはgitをインストールする前にglibcを入れようとするが，glibcを入れるために使うシステムのgccが古すぎてglibcのconfigureが通らず，結局gitのインストールに失敗する．

そこで `brew install gcc --without-glibc` でgccをインストールすればいいかというと，このときgccのビルドにシステムの古いgmp, mpfr, mpcなどのライブラリを使おうとするため，残念ながらこれも失敗してしまう．

`--force-bottle`は？となるが，gccやglibcが入るのは入るが，curlやgitなどの他のコマンドの動的ライブラリ関係でエラーがでてしまう．

以下では，この問題を回避してLinuxbrewでgit, gcc, glibcを入れられる手順を示している．


## Linuxbrewのインストール

Linuxbrewの本体をインストールする．

ここは好きにすればよい．

```
$ mkdir /work/$USER/.linuxbrew
$ mkdir /work/$USER/.cache
$ mkdir /work/$USER/tmp
$ ln -s /work/$USER/.linuxbrew ~/.linuxbrew
$ ln -s /work/$USER/.cache ~/.cache
$ ln -s /work/$USER/tmp ~/tmp
$ sh -c "$(curl -fsSL https://raw.githubusercontent.com/Linuxbrew/install/master/install.sh)"
```

また，以下の記述を `~/.bashrc` か `~/.bash_profile` に追加し，`source ~/.bashrc`などで更新．

```
eval $($HOME/.linuxbrew/bin/brew shellenv)
```

そして `brew doctor` でエラーが出ないか確認．


## openssl, curlのインストール

問題はここからだ．

```
$ brew update
```

先述の通り，現在のLinuxbrewはシステムのcurlが古ければ強制的にcurlをインストールしてくるが，これでopensslとcurlは正常に入る．

ただしgitのインストールに失敗するが，これは無視してよい．

ここで入ったopensslとcurlを使ってローカルでgitをビルドする．


## gitのビルド

最新のgitを自分でビルドする．

このgitはLinuxbrewの初期インストール時以外に，gitのアップグレード時にも利用できるようにしておく．

`./configure` 時の `--with-curl=` や `--with-openssl=` のディレクトリは `brew info curl` や `brew info openssl` で確認して置き換えること． 

```
$ cd /work/$USER
$ git clone https://github.com/git/git.git
$ cd git
$ make configure
$ ./configure --prefix=/work/$USER/localgit --with-curl=$(brew --prefix)/Cellar/curl/7.64.0 --with-openssl=$(brew --prefix)/Cellar/openssl/1.0.2q_2
$ make -j10
$ make install

# 野良gitにパスを通す
$ export PATH=/work/$USER/localgit/bin:$PATH

# /work/$USER/localgit/bin/gitを指しているか確認
$ which git

$ cd /work/$USER
```

また，`~/.bash_profile`や`~/.bashrc`などに追加した`eval $($HOME/.linuxbrew/bin/brew shellenv)`よりも前の行に以下の行を追加しておく．

```
export PATH=/work/$USER/localgit/bin:$PATH
```


## gccビルド

brew経由でgccを入れる方法が思いつかなかったので，ソースからgcc-5をビルドする．

このgccはbrewでglibcをビルドするためだけに利用する．

```
$ cd /work/$USER
$ wget -nc http://ftp.tsukuba.wide.ad.jp/software/gcc/releases/gcc-5.5.0/gcc-5.5.0.tar.xz
$ tar xf gcc-5.5.0.tar.xz
$ cd gcc-5.5.0
$ ./contrib/download_prerequisites
$ cd ..
$ mkdir buildgcc5.5.0
$ cd buildgcc5.5.0
$ ../gcc-5.5.0/configure --enable-languages=c,c++ --prefix=/work/$USER/localgcc-5.5.0 --disable-multilib --disable-bootstrap
$ make -j10
$ make install
```


## glibcのインストール

glibcをビルドするためにgccのシンボリックリンクをbrewに置く

```
$ ln -s /work/$USER/localgcc-5.5.0/bin/gcc $(brew --prefix)/bin/gcc
$ ln -s /work/$USER/localgcc-5.5.0/bin/gcc $(brew --prefix)/bin/gcc-5
$ ln -s /work/$USER/localgcc-5.5.0/bin/g++ $(brew --prefix)/bin/g++
$ ln -s /work/$USER/localgcc-5.5.0/bin/g++ $(brew --prefix)/bin/g++-5
```

`HOMEBREW_NO_ENV_FILTERING=1`にすることで，PATHの通っているビルドしたgitを使ってくれるので，gitの強制インストールは回避される．

```
$ HOMEBREW_NO_ENV_FILTERING=1 brew install glibc
```

ビルドしたgccのリンクを消す

```
$ rm $(brew --prefix)/bin/gcc
$ rm $(brew --prefix)/bin/gcc-5
$ rm $(brew --prefix)/bin/g++
$ rm $(brew --prefix)/bin/g++-5
```


## gccとgitを入れる

```
$ HOMEBREW_NO_ENV_FILTERING=1 brew install gcc
$ HOMEBREW_NO_ENV_FILTERING=1 brew install git
```

もし`git`のインストールに失敗したら`HOMEBREW_NO_ENV_FILTERING=1 brew reinstall gettext`を実行後にもう一度インストールしてみると改善されるかもしれない．

再度ログインしなおして，`brew test gcc`や`brew test git`が動けばOK


## 以降は

この後はお好きにどうぞ．

もし，`brew upgrade git` を行うことがあれば，その時は `HOMEBREW_NO_ENV_FILTERING=1 brew upgrade git` とするのだけを忘れずに．
