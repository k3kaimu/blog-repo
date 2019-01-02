---
layout: post
title:  "[論文紹介] 複素ガウス過程と非線形変換"
categories: blog
tags:  blog
author: けーさん
---

<!-- MathJaxを有効 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-AMS-MML_HTMLorMML" type="text/javascript"></script>
<script type="text/x-mathjax-config">
  MathJax.Hub.Config({
  "HTML-CSS": {
    // デフォルトが ["STIX","TeX"] なのを変更
    // [] にしても良い
    availableFonts: ["TeX"],
    undefinedFamily: "'Raleway', Helvetica, Arial, sans-serif"
  }
  });
</script>


ガウス過程と非線形変換は，それぞれ様々な分野で活用されています．

また，その組み合わせもたくさんの応用先が考えられます．

この記事では，Reed-Solomon符号などの業績で有名なIrving S. Reedにより IEEE Transactions on Information Theory へ投稿された論文 [On the use of Laguerre polynomials in treating the envelope and phase components of narrow-band Gaussian noise](https://ieeexplore.ieee.org/document/1057507) を紹介します．

<!--more-->

## 概要

等価低域系における複素ガウス雑音が，その包絡線に対して非線形変換を受けるシステムを考えます．

このシステムにおいて，包絡線非線形関数$$G(x)$$の一般フーリエ級数展開がラゲール多項式を利用すると得られることが示されています．

またこのシステムで，二つの包絡線非線形関数$$G_1(x)$$と$$G_2(x)$$が与えられたとき，その出力信号の相互相関関数もラゲール多項式を利用して得られることが示されています．


## 内容の簡単なまとめ

論文のタイトルにもあるように，入力信号として狭帯域なガウス雑音を考えます．

この狭帯域ガウス雑音は等価低域系においては，実部と虚部の両方が独立に同一な正規分布に従う複素ガウス雑音になります．

簡単のために，この入力雑音信号$$z$$の電力を$$1$$に正規化すれば，この論文では包絡線$$x=\lvert z \rvert$$に対する非線形関数$$G(\sqrt{2x})$$に次のような一般フーリエ級数展開が存在します．

$$
G(\sqrt{2x}) \sim \sum_{n=0}^{\infty} g_{n,m} x^{m/2} L_n^{(m)}(x) \frac{n!}{\Gamma(m+n+1)}
$$

ここで，$$L_n^{(m)}(x)$$は一般ラゲール多項式（ラゲール陪多項式）であり，$$g_{n,m}$$はフーリエ級数展開の係数です．

そして，この係数$$g_{n,m}$$は次のような積分で表されます．

$$
g_{n,m} = \int_{0}^{\infty} e^{-x} x^{m/2} G(\sqrt{2x}) L_n^{(m)}(x) dx
$$

この係数を用いると，二つの出力信号$$s_1(t) = G_1(z(t))=R_1e^{i\theta_1}$$と$$s_2(t+\tau)=G_2(z(t+\tau))=R_2e^{i\theta_2}$$の相互相関関数は次のように得られます．

$$
\begin{align}
\Gamma_{12}(\tau) &= \mathbb{E}\left[s_1^{*}(t)s_2(t+\tau) \right] = \mathbb{E}\left[G_1(R_1) G_2(R_2) \right] \\
&= \sum_{n=0}^{\infty} \rho^{2n} g_{n,0}^{(1)} g_{n,0}^{(2)}
\end{align}
$$

ここで，$$\rho$$は入力信号$$z$$の自己相関関数$$\rho=\mathbb{E}\left[z^{*}(t)z(t+\tau) \right]$$であり，$$g_{n,m}^{(1)}$$及び$$g_{n,m}^{(2)}$$はそれぞれ$$G_1$$及び$$G_2$$のフーリエ係数です．

論文では，相互相関関数を一般化した次のような値についても導出されています．

$$
\begin{align}
\Gamma_{12}^{(m)}(\tau) &= \mathbb{E}\left[G_1(R_1)G_2(R_2) e^{im(\theta_2 - \theta_1)} \right] \\
&= \rho^m \sum_{n=0}^{\infty} \lvert\rho \rvert^{2n} g_{n,m}^{(1)} g_{n,m}^{(2)} \frac{n!}{\Gamma(m+n+1)}
\end{align}
$$


## 関連研究

+ [Theoretical analysis and performance of OFDM signals in nonlinear AWGN channels](https://ieeexplore.ieee.org/document/837046)

この論文の結果を非線形システムにおけるOFDMの理論解析に応用した論文．

出力信号の電力スペクトル密度を自己相関関数から導出しています．


+ [Orthogonal polynomials for complex Gaussian processes](https://ieeexplore.ieee.org/document/1337247)

ディジタルプリディストーションへの応用．
入力が実数の正規分布に従うのであればエルミート多項式でフーリエ級数展開できることが書かれています．

通信に限っても応用や関連研究はその他多数あります．


## 感想

実は関連研究の項目で一番最初に紹介した論文 "Theoretical analysis and performance of OFDM signals in nonlinear AWGN channels" を先に勉強していたので，この論文はスラスラ読めました．

論文中で展開されている数式もあまり難しくないので，理系大学生であれば時間をかければ読めると思います．

この論文の面白いところは，非線形関数を直交基底で一般フーリエ級数展開すると，そのときの係数が相互相関関数を特徴付けるという結果です．

そして，相互相関関数が特徴付けられるということは自己相関関数や，その周波数領域表現である電力スペクトル密度さえもフーリエ係数で特徴付けられます．

このように，論文は通信分野に限っても非常に多方面へ応用できる可能性を秘めています．

例えば，この解析を全二重通信の自己干渉キャンセラの性能解析に応用した研究成果を2018年11月にIEICEの無線通信システム（RCS）研究会にて報告しました．

+ [非線形自己干渉キャンセラのためのラゲール陪多項式を用いた理論的性能解析](https://www.ieice.org/ken/paper/20181121R1Hn/)

