---
layout: post
title:  "正規分布の期待値演算の微分"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

<div hidden>
$$
\newcommand{\ABS}[1]{\left|#1\right|}
\newcommand{\brkts}[1]{\left(#1\right)}
\newcommand{\Brkts}[1]{\left\{#1\right\}}
\newcommand{\BRKTS}[1]{\left[#1\right]}
\newcommand{\arctanh}{\mathrm{tanh}^{-1}}
\newcommand{\relmiddle}[1]{\mathrel{}\middle#1\mathrel{}}
$$
</div>


正規分布に従う確率変数$x \sim \mathcal{N}(\mu, \sigma^2)$について，次のような公式があります．

$$
  \frac{\partial}{\partial \mu} \mathbb{E}_{x}\BRKTS{f(x)} = \mathbb{E}_{x}\BRKTS{\frac{\partial}{\partial x} f(x)} = \frac{1}{\sigma^2} \brkts{ \mathbb{E}_{x}\BRKTS{xf(x)} - \mu \mathbb{E}_{x}\BRKTS{f(x)} }
$$

<!--more-->

ただし，確率変数$z$を用いて$f(x)$について$z = x - \mu$として$\mathbb{E}_{z}\BRKTS{\frac{\partial}{\partial \mu} f(z + \mu)} < \infty$が成立する必要があります（が工学的にはほとんどの場合で大丈夫だと思います）．


## 平均0における証明

まずは平均0の正規分布に従う確率変数$z \sim \mathcal{N}(0, \sigma^2)$について以下の式を証明します．

$$
  \mathbb{E}_{z}\BRKTS{ \frac{\partial}{\partial z} f(z) } = \frac{1}{\sigma^2} \mathbb{E}\BRKTS{ zf(z) }
$$

まあ，以下のように左辺を式変形するだけで証明できますが．

$$
\begin{align}
  \sqrt{2\pi \sigma^2} \mathbb{E}_{z}\BRKTS{ \frac{\partial}{\partial z} f(z) } &= \int_{\mathbb{R}} \brkts{\frac{\partial}{\partial z} f(z)} \mathrm{e}^{-\frac{z^2}{2\sigma^2}} \mathrm{d}z \\
  &=  \BRKTS{ f(z) \mathrm{e}^{-\frac{z^2}{2\sigma^2}} }_{-\infty}^{\infty} - \int_{\mathbb{R}} f(z) \mathrm{e}^{-\frac{z^2}{2\sigma^2}} \brkts{- \frac{z}{\sigma^2}} \mathrm{d}z \\
  &= 0 + \sqrt{2\pi \sigma^2} \frac{1}{\sigma^2} \mathbb{E}_{z}\BRKTS{ zf(z) }
\end{align}
$$

なお，この公式は非線形システムに関する論文を読んでるとBussgangの定理に関連してよく出てきます．
Bussgangの定理とは，非線形関数$f(z)$からの出力について

$$
f(z) = cz + d(z)
$$

と線形近似して分解する定理です．
ただし，$c = \frac{1}{\sigma^2} \mathbb{E}\_{z}\BRKTS{zf(z)} = \mathbb{E}\_{z}\BRKTS{ \frac{\partial g(z)}{\partial z} }$であり，$\mathbb{E}\_{z}\BRKTS{zd(z)} = 0$です．


## 平均$\mu$における証明

それでは本題の証明です．
仮定より，このとき$\mu$に対する微分と$z$に対する期待値操作は入れ替えられるため，

$$
  \frac{\partial}{\partial \mu} \mathbb{E}_{x}\BRKTS{f(x)} = \frac{\partial}{\partial \mu} \mathbb{E}_{z}\BRKTS{f(z + \mu)} = \mathbb{E}_{z}\BRKTS{ \frac{\partial}{\partial \mu} f(z + \mu)} 
$$

が成立します．また，偏微分に関して次式が成立します．

$$
  \frac{\partial}{\partial \mu} f(z + \mu) = \frac{\partial}{\partial x} f(x) = \frac{\partial}{\partial z} f(z + \mu)
$$

これを利用することで次式が得られます．

$$
  \frac{\partial}{\partial \mu} \mathbb{E}_{x}\BRKTS{f(x)} = \mathbb{E}_{z}\BRKTS{ \frac{\partial}{\partial \mu} f(z+\mu) } = \mathbb{E}_{x}\BRKTS{ \frac{\partial}{\partial x} f(x)}  = \mathbb{E}_{z}\BRKTS{ \frac{\partial}{\partial z} f(z + \mu)} 
$$

最終的に，右辺に先ほど証明した平均0の場合の公式を使うことで，以下のように示すことができます．

$$
\begin{align}
  \frac{\partial}{\partial \mu} \mathbb{E}_{x}\BRKTS{f(x)} &= \frac{1}{\sigma^2} \mathbb{E}_{z}\BRKTS{ z f(z + \mu)} \\
  &= \frac{1}{\sigma^2} \mathbb{E}_{x}\BRKTS{ (x-\mu) f(x)} \\
  &= \frac{1}{\sigma^2} \brkts{ \mathbb{E}_{x}\BRKTS{ x f(x)} - \mu \mathbb{E}_{x}\BRKTS{ f(x)} }
\end{align}
$$


## 条件付き期待値に対する同様の公式

今，正規分布に従う入力$x \sim \mathcal{N}(\mu, \sigma^2)$をあるシステムに与えた時，ある出力$y$が得られたとします．
このシステムの入出力の関係が条件付き確率$p(y | x)$で与えられているとします．

システムの出力の観測結果$y$が与えられたときに，以下の$f(x)$の条件付き期待値を考えます．

$$
\mathbb{E}_{x}\BRKTS{ f(x) \relmiddle| y } = \int_{\mathbb{R}} f(x) p(x | y) \mathrm{d}x =  \frac{1}{\mathcal{Z}} \int_{\mathbb{R}} f(x) p(y | x) p(x) \mathrm{d}x
$$

ただし，$\mathcal{Z}$は正規化定数です．

$$
\mathcal{Z} = \int_{\mathbb{R}} p(y | x) p(x) \mathrm{d}x
$$

この条件付き期待値については，次のような式を導出できます．

$$
  \frac{\partial}{\partial \mu} \mathbb{E}_{x}\BRKTS{ f(x) \relmiddle| y } = \frac{1}{\sigma^2} \brkts{ \mathbb{E}_{x}\BRKTS{ x f(x) \relmiddle| y } - \mathbb{E}_{x}\BRKTS{x \relmiddle| y} \mathbb{E}_{x}\BRKTS{f(x) \relmiddle| y} }
$$

導出は，$\mathbb{E}_{x}\BRKTS{ f(x) \relmiddle\| y } = \frac{1}{\mathcal{Z}} \mathbb{E}_x\BRKTS{ f(x) p(y \| x) } $と式変形をして，正規化定数$\mathcal{Z}$が実際には$\mu$の関数$\mathcal{Z}(\mu) = \mathbb{E}\_{x}\BRKTS{p(y\|x)}$であることに注意してこれまでに導出した式を適用するだけです．

$$
\begin{align}
\frac{\partial}{\partial \mu} \mathbb{E}_{x}\BRKTS{ f(x) \relmiddle| y } &= \frac{\partial}{\partial \mu} \frac{1}{\mathcal{Z}(\mu)} \mathbb{E}_x\BRKTS{ f(x) p(y | x) } \\
&= \frac{1}{\mathcal{Z}^2(\mu)} \BRKTS{ \brkts{\frac{\partial}{\partial \mu} \mathbb{E}_x\BRKTS{ f(x) p(y | x) }} \mathcal{Z}(\mu) - \mathbb{E}_x\BRKTS{ f(x) p(y | x) } \brkts{\frac{\partial}{\partial \mu} \mathcal{Z}(\mu)} } \\
&= \frac{1}{\mathcal{Z}(\mu) \sigma^2} \Brkts{ \mathbb{E}_x\BRKTS{x f(x) p(y | x)} - \mu\mathbb{E}_x\BRKTS{f(x) p(y | x)} } \\
&- \frac{1}{\mathcal{Z}^2(\mu) \sigma^2} \Brkts{ \mathbb{E}_x\BRKTS{ f(x) p(y | x) } \brkts{ \mathbb{E}_{x}\BRKTS{x p(y|x)} - \mu \mathbb{E}_{x}\BRKTS{ p(y|x) } } } \\
&= \frac{1}{\sigma^2} \brkts {\mathbb{E}_x\BRKTS{x f(x) \relmiddle| y} - \mu \mathbb{E}_{x}\BRKTS{ f(x) \relmiddle| y } - \mathbb{E}_{x}\BRKTS{ f(x) \relmiddle| y } \mathbb{E}_{x}\BRKTS{x \relmiddle | y} + \mu \mathbb{E}_{x}\BRKTS{ f(x) \relmiddle| y } } \\
&= \frac{1}{\sigma^2} \brkts{ \mathbb{E}_{x}\BRKTS{ x f(x) \relmiddle| y } - \mathbb{E}_{x}\BRKTS{x \relmiddle|y} \mathbb{E}_{x}\BRKTS{f(x) \relmiddle| y} }
\end{align}
$$

特に，$f(x) = x$であれば$\hat{x}(\mu) = \mathbb{E}\_{x}\BRKTS{x \relmiddle\| y}$として以下のような式が得られます．

$$
  \frac{\partial}{\partial \mu} \hat{x}(\mu) = \frac{1}{\sigma^2} \brkts{ \mathbb{E}_{x}\BRKTS{ x^2 \relmiddle| y } - \mathbb{E}_{x}\BRKTS{x \relmiddle|y}^2 } = \frac{1}{\sigma^2} \mathbb{E}_{x}\BRKTS{ \brkts{x - \hat{x}(\mu)}^2 \relmiddle| y}
$$

この最後の式は，AMPやEPの文脈でよく見ますね．

