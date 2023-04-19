---
layout: post
title:  "TCP/IP経由で複数のUSRPで同期送受信する"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

タイトルの通り，TCP/IP経由で複数のUSRPで同期送受信をするプログラムを作りました．
ソースコードは[私のGitHubリポジトリ](https://github.com/k3kaimu/multiusrp)に上げています．

<!--more-->

## 何ができるの？

このプログラムをUSRPを接続したPCで動作させておきます．
そして，別のPCから（もしくは同一PCの中で），TCP/IP経由でコマンドを発行することで，USRPから送受信ができます


## 例

以下のようにこのプログラムを起動すると，送信機としてUSRPを2台（`addr0=192.168.10.211,addr1=192.168.10.212`）と受信機としてUSRPを2台（`addr0=192.168.10.213,addr1=192.168.10.214`）を制御できるようになります．
また，4台すべてのUSRPは外部からの10MHz参照クロックとPPS参照パルスで同期されます．

```sh
$ ./multiusrp --tx-args="addr0=192.168.10.211,addr1=192.168.10.212" --rx-args="addr0=192.168.10.213,addr1=192.168.10.214" --tx-rate=1e6 --rx-rate=1e6 --tx-freq=2.45e9 --rx-freq=2.45e9 --tx-gain=10 --rx-gain=30 --clockref=external --timeref=external --timesync=true --tx-channels="0,1" --rx-channels="0,1" --port=8888
```

これを実行して少し待つと，8888ポートにTCP/IPでコマンドを発行できます．
TCP/IPのソケット通信ができるプログラミング言語やライブラリを用いて制御できます．
つまり，大体のプログラミング言語からこのソフトにコマンドを発行可能です．

また[Python用に簡単にTCP/IP経由のコマンドを発行できるライブラリ](https://github.com/k3kaimu/multiusrp/blob/master/client/multiusrp.py)も作っています．
このライブラリを使えば，以下のように簡単にUSRPから信号の送受信ができます．

```py
import multiusrp
import numpy as np
import time

# サーバーIPとポート番号
IPADDR = "127.0.0.1";
PORT = 8888;

nTXUSRP = 2     # 送信機2台
nRXUSRP = 2     # 受信機2台

nSamples = 2**10

bpsk_constellation = np.array([1+0j, -1+0j])
qpsk_constellation = np.array([1+1j, -1+1j, -1-1j, 1-1j]) / np.sqrt(2)

# IPアドレスとポートを指定して，制御ソフトに接続
# これ以降で`usrp`オブジェクトを利用してTCP/IP経由でコマンド発行可能
with multiusrp.SimpleClient(IPADDR, PORT, nTXUSRP, nRXUSRP) as usrp:

    # 送信用のBPSKとQPSK信号を生成
    signals = [
        np.repeat(np.random.choice(bpsk_constellation, nSamples//4), 4),
        np.repeat(np.random.choice(qpsk_constellation, nSamples//4), 4),
    ]

    rxAlignSize = nSamples
    usrp.changeRxAlignSize(rxAlignSize) # 受信アライメントを送信信号長に設定
    usrp.transmit(signals)              # 送信信号を設定
    usrp.sync()                         # 送受信機で同期を取り直す

    recv1 = usrp.receive(nSamples)  # 2台から受信
    print(recv1)
```


## コマンドの詳細

[Readmeを参照してください．](https://github.com/k3kaimu/multiusrp/blob/master/readme.md)


## 送信と受信の同期について

このプログラムでは，以下の機構により送信と受信の同期を簡単に扱うことができています．

1. PPS

PPS信号を利用することで，初回の送信・受信の絶対時間を同期しています．

2. 送信と受信のアライメント

PPSは「初回の絶対時間の同期」ですが，送受信のアライメントという機構によって「継続して相対時間を同期」しています．

そもそも，送信と受信の同期とは，「送信の開始と受信の開始の時間をあわせる」ことを意味します．
そのため，ループ送信・ループ受信している場合には，送信信号のサイズと受信バッファのサイズを揃えないと，少しずつ送信開始時刻と受信開始時刻がズレていきます．

もし，現在設定されている送信信号のサンプル数（送信アライメント）と受信アライメントの値が一致しているのであれば，
どれだけ時間が経っても送信開始時刻と受信開始時刻は同期されています．

また，このプログラムでは送信信号は一度送信されたあともループして送信を続けますが，このループ中に新しい信号の設定命令が到来した場合，現在設定されている信号を最後まで送信が終わり次第，次の信号の送信に切り替わります．
そのため，サイズ`N`の信号を送信中に，同一サイズ`N`の別の信号を設定したとしても送受信間に同期のずれは発生しません．

なお，受信においてアライメントと受信サンプル数は異なる値にすることができます．
受信アライメントとは，単に受信を開始する境界をアライメント数`N`の周期に設定しているだけであり，受信サンプル数とは独立した考えた方です．


## 感想

TCP/IPでUSRPを制御して送受信できるだけですごく便利です．

