---
layout: post
title:  "微分できない複素関数の一次近似"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

複素関数の微分と一次近似がよくわからなくなったのでまとめました．

<!--more-->

## 実数関数の微分と一次近似

実数関数$f(x)$の$x=a$での微分値は以下の極限で定義される．

$$\displaystyle
f'(a) = \lim_{\Delta x \rightarrow 0} \frac{f(a + \Delta x) - f(a) }{\Delta x}
$$

実際に$f(x)=x^3$で考えてみよう．
まず，分子については

$$\displaystyle
f(a + \Delta x) - f(a) = 3 a^2 \Delta x + 3 a (\Delta x)^2 + (\Delta x)^3
$$

であり，$\Delta x$の二次以上の項をゼロに近似してしまえば

$$\displaystyle
f(a + \Delta x) - f(a) \approx 3 a^2 \Delta x
$$

である．
したがって，$f(x)=x^3$の$x=a$での微分値は$f'(a) = 3 a^2$である．

実数関数の$x=a$近傍での一次近似はテイラー展開より以下の通りである．

$$
f(a + \Delta x) \approx f(a) + f'(a) \Delta x
$$

実際に，$f(x)=x^3$で考えれば

$$
f(a + \Delta x) \approx f(a) + 3 a^2 \Delta x
$$

となり，これは$f(a + \Delta x)$の$\Delta x$の二次以上の項をゼロに近似した結果に一致する．


## 複素関数の微分

複素関数$f(z)$の$z=a$での微分値は以下の極限で定義される．

$$\displaystyle
f'(a) = \lim_{\Delta z \rightarrow 0} \frac{f(a + \Delta z) - f(a) }{\Delta z}
$$

実数関数の場合と基本的には同じなので，途中を省略するが，$f(z)=z^3$の$z=a$での微分値は$f'(a) = 3 a^2$である．

同様に，一次近似は以下の通りである．

$$
f(a + \Delta z) \approx f(a) + f'(a) \Delta z
$$

実際に，$f(z) = z^3$について$f(a + \Delta z)$と一次近似を比較すれば，$\Delta z$の二次以上の項をゼロに近似した結果に一致する．



## 複素微分できない複素関数の微分

複素関数として$f(z) = z|z|^2$を考える．
この関数は$z=0$以外では複素微分できない．
実際に確かめてみよう．

$$
\begin{align}
f(a + \Delta z) - f(a) &= (a + \Delta z)|a + \Delta z|^2 - a|a|^2 \\
&=  2 |a|^2 \Delta z + a^2 \Delta z^{*} + 2a |\Delta z|^2 + a^{*} \Delta z^2 + \Delta |\Delta z|^2 \\
&\approx 2 |a|^2 \Delta z + a^2 \Delta z^{*} 
\end{align}
$$

であるから

$$
\begin{align}
f'(a) &= \lim_{\Delta z \rightarrow 0} \frac{f(a + \Delta z) - f(a) }{\Delta z} \\
&= \lim_{\Delta z \rightarrow 0} \frac{ 2|a|^2 \Delta z + a^2 \Delta z^{*} }{\Delta z} \\
&= 2|a|^2 + a^2 \lim_{\Delta z \rightarrow 0} \frac{ \Delta z^{*} }{\Delta z}
\end{align}
$$

となり，第二項は$\Delta z$の近づけ方によって位相が変化して定まらないことがわかる．
つまり，$a\not=0$では極限が定義できず，微分できない．

というわけで，$a\not=0$で微分できないのでテイラー展開による一次近似はできない．

しかし，工学的には$f(a + \Delta z)$を一次近似したい場合がある．
そして，その一次近似が$f(a + \Delta z) \approx f(a) + 2 |a|^2 \Delta z + a^2 \Delta z^{*} $となってほしい気持ちがある．

このような複素微分不可能な関数に微分を割り当てる方法としてウィルティンガー微分がある．

ウィルティンガー微分とは，簡単にいえば$z$と$z^{*}$を独立変数として扱う微分である．
つまり，$f(z,z^{*}) = z|z|^2 = z^2 z^{*}$に関して，

$$
\begin{align}
\frac{\partial f(z,z^{*})}{\partial z} &= 2zz^{*} = 2|z|^2 \\
\frac{\partial f(z,z^{*})}{\partial z^{*}} &= z^2
\end{align}
$$

である．
ウィルティンガー微分を用いた複素関数の一次近似は以下の通りである．

$$
\begin{align}
f(a + \Delta z) \approx f(a) + \frac{\partial f(z,z^{*})}{\partial z} \Delta z +  \frac{\partial f(z,z^{*})}{\partial z^{*}} \Delta z^{*}
\end{align}
$$

さて，$f(z) = z\|z\|^2$について考えれば，

$$
\begin{align}
f(a + \Delta z) \approx f(a) + 2|a|^2 \Delta z + a^2  \Delta z^{*}
\end{align}
$$

となり，希望どおりの一次近似の式が得られる．
