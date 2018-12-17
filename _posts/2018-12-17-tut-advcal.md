---
layout: post
title:  "OpenFortiVPNを使ってTUT-VPNに接続する"
categories: blog
tags:  blog
author: けーさん
---

この記事は[TUT Advent Calendar 2018](https://adventar.org/calendars/2906)の17日目の記事です．

<!--more-->

豊橋技術科学大学(TUT)は去年度までCiscoのVPNが採用されていて，その時は[やんてねさんが2016年のアドベントカレンダーで書かれているように](https://yantene.net/use_tutvpn_wisely.html)OpenConnectを使ってVPNに接続できていました．

しかし，今年度からはFortinetのVPNが採用されているようで，2016年のやんてねさんの方法が使えなくなってしまいました．

いろいろ探してみたところ，[OpenFortiVPN](https://github.com/adrienverge/openfortivpn)というものがあるようで，これを使ってVPNに接続してみましたので書いておきます．

## 注意

そもそもネットワークよくわからん民ですので，[変な所があればPull Request送ってください](https://github.com/k3kaimu/blog-repo/pulls)．


## OpenFortiVPNのインストール

Macであればbrewで入れることができます．
簡単ですね．
他のOSの方は各自で調べてください．

```sh
brew install openfortivpn
```


## OpenFortiVPNでつなげる

以下のような感じで，まずVPNにつなげます．

必要に応じてオプション`--trusted-cert <sha256 sum>`を追加してください．

このコマンドで`ppp0`というインターフェイスが生えるみたいです．

```sh
openfortivpn gw.vpn.tut.ac.jp:443 -u <User ID> --no-route 
```

次に`route add`で特定の経路のみをVPNに流すようにします．

これを`/etc/ppp/ip-up`に書いておくといいらしいです．

```sh
route add -net <target network IP>/24 -interface ppp0
```

## まとめ

OpenFortiVPNでTUT VPNに接続する方法を書きました．

何かありましたら[Pull Request](https://github.com/k3kaimu/blog-repo/pulls)お願いします．
