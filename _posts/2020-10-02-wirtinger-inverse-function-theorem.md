---
layout: post
title:  "ウィルティンガー微分可能関数の逆関数の微分"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

$f(z)$が$z$についてウィルティンガー微分可能なとき，$f^{-1}(z)$の微分はどうなるのかと調べたけどわからなかったのでメモ．

<!--more-->

たぶん導出には2変数関数の逆関数定理を使うのが簡単だと思う

## 2変数関数の逆関数定理

$u(x, y)$と$v(x, y)$について，ヤコビ行列$\mathbf{J}_{u,v}(x,y)$は以下の通りである．

$$
\mathbf{J}_{u,v}(x,y) = \begin{bmatrix}
\frac{\partial u}{\partial x} & \frac{\partial u}{\partial y} \\
\frac{\partial v}{\partial x} & \frac{\partial v}{\partial x}
\end{bmatrix}
$$

逆関数$g(u(x,y), v(x,y))=x$及び$h(u(x,y), v(x,y))=y$のヤコビ行列$\mathbf{J}_{g,h}(u,v)$は次のように書ける．

$$
\mathbf{J}_{g,h}(u(x,y),v(x,y)) = (\mathbf{J}_{u,v}(x,y))^{-1}
$$

つまり，逆関数のヤコビ行列は元の関数のヤコビ行列の逆行列であるというのが逆関数定理．

## ウィルティンガー微分系でのヤコビ行列

次のような行列を考える．

$$
\mathbf{U} = \frac{1}{\sqrt{2}} \begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
$$

この行列は$\mathbf{U}\mathbf{U}^H = \mathbf{I}$を満たすユニタリ行列である．

ある複素関数$f(z)$を$f(x+iy)=u(x,y)+iv(x,y)$として，そのヤコビ行列$\mathbf{J}_{u,v}(x,y)$に$\mathbf{U}$を次のように作用させると

$$
\begin{align*}
\mathbf{U} \mathbf{J}_{u,v}(x,y) \mathbf{U}^H &= 
\frac{1}{2} \begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
\begin{bmatrix}
\frac{\partial u}{\partial x} & \frac{\partial u}{\partial y} \\
\frac{\partial v}{\partial x} & \frac{\partial v}{\partial x}
\end{bmatrix}
\begin{bmatrix}
1 & 1 \\
-i & i
\end{bmatrix} \\
&= 
\begin{bmatrix}
\frac{\partial f}{\partial z} & \frac{\partial f}{\partial z^{\ast}} \\
\frac{\partial f^{\ast}}{\partial z} & \frac{\partial f^{\ast}}{\partial z^{\ast}}
\end{bmatrix} \\
&= \mathbf{J}_{f,f^{\ast}}(z,z^{\ast})
\end{align*}
$$

となるように，ウィルティンガー微分系でのヤコビ行列は複素関数を実部と虚部の2変数関数とみなしたときのヤコビ行列を使って記述できる．


## ウィルティンガー微分可能な関数の逆関数の微分

$f(z) = f(z,z^{\ast})$の逆関数$f^{-1}(z) = f^{-1}(z,z^{\ast})$のウィルティンガー微分を求めよう．

逆関数定理より，行列$\mathbf{U}$はユニタリ行列であるから，

$$
\begin{align*}
J_{f^{-1},f^{-1,\ast}}(f(z,z^{\ast}),f^{\ast}(z,z^{\ast})) &= \mathbf{U} \mathbf{J}_{g,h}(u(x,y),v(x,y)) \mathbf{U}^H  \\
&= \mathbf{U} (\mathbf{J}_{u,v}(x,y))^{-1} \mathbf{U}^H \\
&= (\mathbf{U} \mathbf{J}_{u,v}(x,y) \mathbf{U}^H)^{-1} \\
&= (\mathbf{J}_{f,f^{\ast}}(z,z^{\ast}))^{-1} \\
&= \begin{bmatrix}
\frac{\partial f}{\partial z} & \frac{\partial f}{\partial z^{\ast}} \\
\frac{\partial f^{\ast}}{\partial z} & \frac{\partial f^{\ast}}{\partial z^{\ast}}
\end{bmatrix}^{-1}
\end{align*}
$$

となる．
したがって，$f(z)$の逆関数$f^{-1}(z)$のウィルティンガー微分は

$$
\frac{\partial f^{-1}}{\partial z} (f(z)) = \frac{1}{ \left| \frac{\partial f}{\partial z} \right|^2 - \left| \frac{\partial f}{\partial z^{\ast}} \right|^2 } \left(\frac{\partial f}{\partial z}(z)\right)^{\ast}
$$

及び

$$
\frac{\partial f^{-1}}{\partial z^{\ast}} (f(z)) = -\frac{1}{ \left| \frac{\partial f}{\partial z} \right|^2 - \left| \frac{\partial f}{\partial z^{\ast}} \right|^2 } \left(\frac{\partial f}{\partial z^{\ast}}(z)\right)^{\ast}
$$

となる．
たぶん．


