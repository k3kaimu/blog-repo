---
layout: post
title:  "gitリポジトリが壊れた話"
categories: blog
tags:  blog
author: けーさん
---

* content
{:toc}

突然今週初めに，研究のソースコードを管理しているGitリポジトリが壊れてしまったので，
一部始終をまとめておきます．

<!--more-->

## Gitリポジトリ壊れる

いつも[Source Tree](https://ja.atlassian.com/software/sourcetree)を使ってGitを使っているのですが，
ある日突然エラーが出てコミットなどができなくなってしまいました．
ターミナルで`git log`を行った際のエラーはこんな感じでした．

~~~~sh
$ git log
error: Could not read 7f1437ef01859df23297856c9b20cbcd1e63b247
fatal: Failed to traverse parents of commit c3eb19c0f926ac09ad13b67072886e6662d39661
~~~~

多分ローカルリポジトリをGoogleDrive上に保存しているから壊れたんでしょうけど，
明確に原因はわからず．．．


## 解決策(強硬手段)

ググってもいい情報がなく，どうするかかなり迷いました．
3日くらい調べながらいろいろ試行錯誤したものの，結局解決できず，次のように強硬手段を取りました．

~~~~sh
$ rm -rf .git
$ git remote add origin [リモートリポジトリのURL]
$ git fetch origin
$ git reset --hard origin/master
~~~~

今回はちゃんと全コミットをリモートリポジトリ(研究室のGitLab)にプッシュしていたので，
上の方法で解決できました．
よかったよかった(？)．
