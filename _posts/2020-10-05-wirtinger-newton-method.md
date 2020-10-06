---
layout: post
title:  "非正則な関数のニュートン法"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

非正則な複素関数におけるニュートン法ってどうなるんだっけ，というメモ．


<!--more-->

## 微分可能な実数関数のニュートン法

ある関数$f(x)$が実数で微分可能としたとき，$f(x)=0$を満たす実数$x$を探したいときに使うのがニュートン法．

$f(x)$をある点$x$付近でのテイラー展開で1次近似すると，

$$
f(x + \Delta x) \approx f(x) + \frac{df}{dx}(x) \Delta x
$$

右辺を0にするためには

$$
\Delta x = - \frac{f(x)}{\frac{df}{dx}(x)}
$$

とすればよいので，

$$
x_{n+1} = x_{n} - \frac{f(x_n)}{\frac{df}{dx}(x_n)}
$$



というように$x$を更新していくと，$x$は次第に$f(x)=0$を満たす値に収束する．


## 正則な複素関数のニュートン法

複素関数においても，$f(z)$が正則（複素微分可能）であれば実数関数と全く同じニュートン法が使える．

$$
z_{n+1} = z_{n} - \frac{f(z_n) }{ \frac{d f}{d z}(z_n) }
$$

## 非正則な複素関数のニュートン法

複素関数$f(z)$が非正則（複素微分できない）場合というのは，実は世の中に多くある．
たとえば，$f(z)=|z|^2$は複素微分できないので非正則関数である．

しかし，$f(z)$の実部と虚部がそれぞれ$z=x+iy$の$x$や$y$で微分できれば（ウィルティンガー微分可能ならば），少し形を変えたニュートン法が使える．

まず，今回考える複素関数を$f(z=x+iy)=u(x,y)+iv(x,y)$のように実部$u(x,y)$と虚部$v(x,y)$に分離する．

実部$u(x,y)$のテイラー展開による一次近似は次のとおりである．

$$
u(x + \Delta x, y + \Delta y) \approx u(x, y) + \frac{\partial u}{\partial x}(x) \Delta x + \frac{\partial u}{\partial y}(y) \Delta y
$$

同様に虚部$v(x,y)$のテイラー展開による一次近似も以下のとおり記述できる．

$$
v(x + \Delta x, y + \Delta y) \approx v(x, y) + \frac{\partial v}{\partial x}(x) \Delta x + \frac{\partial v}{\partial y}(y) \Delta y
$$

このままだと見通しが悪いので，両方の近似式を行列とベクトルを使って表現すると，次のような式を得る．

$$
\begin{bmatrix}
u(x + \Delta x, y + \Delta y) \\
v(x + \Delta x, y + \Delta y)
\end{bmatrix}
\approx
\begin{bmatrix}
u(x, y) \\
v(x, y)
\end{bmatrix}
+
\begin{bmatrix}
\frac{\partial u}{\partial x}(x,y) & \frac{\partial u}{\partial y}(x,y) \\
\frac{\partial v}{\partial x}(x,y) & \frac{\partial v}{\partial y}(x,y)
\end{bmatrix}
\begin{bmatrix}
\Delta x \\
\Delta y
\end{bmatrix}
$$

さらに見通しを良くするために，次のようにベクトル変数を割り当てる．

$$
\mathbf{f}_{u,v}(x,y) = \begin{bmatrix}
u(x, y) \\
v(x, y)
\end{bmatrix}
$$

$$
\mathbf{J}_{u,v}(x,y) = \begin{bmatrix}
\frac{\partial u}{\partial x}(x,y) & \frac{\partial u}{\partial y}(x,y) \\
\frac{\partial v}{\partial x}(x,y) & \frac{\partial v}{\partial y}(x,y)
\end{bmatrix}
$$

$$
\mathbf{\Delta}_{x,y} = \begin{bmatrix}
\Delta x \\
\Delta y
\end{bmatrix}
$$

さて，これらの変数を使って一次近似式の右辺$=\mathbf{0}$とすれば，次のような式を得る．

$$
\mathbf{\Delta}_{x,y}
= -\left[\mathbf{J}_{u,v}(x,y)\right]^{-1} \mathbf{f}_{u,v}(x,y)
$$

ここで次のような行列$\mathbf{U}$を考える．

$$
\mathbf{U} = \frac{1}{\sqrt{2}} \begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
$$

この行列は$\mathbf{U}\mathbf{U}^H = \mathbf{I}$を満たすユニタリ行列である．

この行列を両辺に作用させると，次のようになる．

$$
\mathbf{U} \mathbf{\Delta}_{x,y} 
= - \mathbf{U} \left[\mathbf{J}_{u,v}(x,y)\right]^{-1} \mathbf{f}_{u,v}(x,y)
$$

さて，一つずつ考えていこう．
まず，左辺について

$$
\begin{align*}
\mathbf{U} \mathbf{\Delta}_{x,y} 
&=
\frac{1}{\sqrt{2}}
\begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
\begin{bmatrix}
\Delta x \\
\Delta y
\end{bmatrix} \\
&= \frac{1}{\sqrt{2}}
\begin{bmatrix}
\Delta x + i \Delta y \\
\Delta x - i \Delta y
\end{bmatrix} \\
&= \frac{1}{\sqrt{2}}
\begin{bmatrix}
\Delta z \\
(\Delta z)^{*}
\end{bmatrix}
\end{align*}
$$

ただし，$\Delta z = \Delta x + i \Delta y$とした．

残る右辺については，$\mathbf{U}^H\mathbf{U} = \mathbf{I}$であることを利用すれば

$$
\begin{align*}
- \mathbf{U} \left[\mathbf{J}_{u,v}(x,y)\right]^{-1} \mathbf{f}_{u,v}(x,y)  \\
&=- \mathbf{U} \left[\mathbf{J}_{u,v}(x,y)\right]^{-1} \mathbf{U}^H \mathbf{U} \mathbf{f}_{u,v}(x,y)  \\
&= - \left[\mathbf{U} \mathbf{J}_{u,v}(x,y) \mathbf{U}^{H} \right]^{-1} \mathbf{U} \mathbf{f}_{u,v}(x,y) 
\end{align*}
$$

となる．

まず，$\mathbf{U} \mathbf{f}_{u,v}(x,y) $について要素を書き下すと

$$
\mathbf{U} \mathbf{f}_{u,v}(x,y) = \frac{1}{\sqrt{2}}
\begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
\begin{bmatrix}
u(x,y) \\
v(x,y)
\end{bmatrix} =
\frac{1}{\sqrt{2}}
\begin{bmatrix}
f(z) \\
f^{\ast}(z)
\end{bmatrix}
$$

となる．


次に，$\mathbf{U} \mathbf{J}_{u,v}(x,y) \mathbf{U}^{H}$について要素を書き下すと

$$
\begin{align*}
\mathbf{U} \mathbf{J}_{u,v}(x,y) \mathbf{U}^{H} &= 
\frac{1}{2}
\begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
\begin{bmatrix}
\frac{\partial u}{\partial x}(x,y) & \frac{\partial u}{\partial y}(x,y) \\
\frac{\partial v}{\partial x}(x,y) & \frac{\partial v}{\partial y}(x,y)
\end{bmatrix}
\begin{bmatrix}
1 & 1 \\
-i & i
\end{bmatrix} \\
&= 
\begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
\begin{bmatrix}
\frac{1}{2} \left(\frac{\partial }{\partial x} - i \frac{\partial }{\partial y} \right)u(x,y) & \frac{1}{2} \left(\frac{\partial }{\partial x} + i \frac{\partial }{\partial y} \right)u(x,y) \\
 \frac{1}{2} \left(\frac{\partial }{\partial x} - i \frac{\partial }{\partial y} \right)v(x,y) & \frac{1}{2} \left(\frac{\partial }{\partial x} + i \frac{\partial }{\partial y} \right)v(x,y)
\end{bmatrix}
\end{align*} 
$$

また見通しが悪くなってきたので，以下のとおりウィルティンガー微分を導入する．

$$
\frac{\partial }{\partial z} = \frac{1}{2} \left(\frac{\partial }{\partial x} - i \frac{\partial }{\partial y} \right)
$$

$$
\frac{\partial }{\partial z^{\ast}} = \frac{1}{2} \left(\frac{\partial }{\partial x} + i \frac{\partial }{\partial y} \right)
$$

すると，

$$
\begin{align*}
\mathbf{U} \mathbf{J}_{u,v}(x,y) \mathbf{U}^{H} &= 
\begin{bmatrix}
1 & i \\
1 & -i
\end{bmatrix}
\begin{bmatrix}
\frac{\partial u}{\partial z} (x,y) & \frac{1}{2} \frac{\partial u}{\partial z^{\ast}} (x,y) \\
 \frac{\partial v}{\partial z} (x,y) & \frac{1}{2} \frac{\partial v}{\partial z^{\ast}} (x,y)
\end{bmatrix} \\
&=
\begin{bmatrix}
\frac{\partial f}{\partial z} (z) & \frac{\partial f}{\partial z^{\ast}} (z) \\
 \frac{\partial f^{\ast}}{\partial z} (z) & \frac{\partial f^{\ast}}{\partial z^{\ast}} (z)
\end{bmatrix}
\end{align*}
$$

を得る．

以上より，以下の式を得る．


$$
\frac{1}{\sqrt{2}}
\begin{bmatrix}
\Delta z \\
(\Delta z)^{*}
\end{bmatrix}
=
- 
\frac{1}{\sqrt{2}}
\begin{bmatrix}
\frac{\partial f}{\partial z} (z) & \frac{\partial f}{\partial z^{\ast}} (z) \\
 \frac{\partial f^{\ast}}{\partial z} (z) & \frac{\partial f^{\ast}}{\partial z^{\ast}} (z)
\end{bmatrix}^{-1}
\begin{bmatrix}
f(z) \\
f^{\ast}(z)
\end{bmatrix}
$$

そのため，更新ルールは次のようになる．

$$
z_{n+1} = z_{n} - \frac{f(z_n) \frac{\partial f^{\ast}}{\partial z^{\ast}}(z_n) - f^{\ast}(z_n) \frac{\partial f}{\partial z^{\ast}} (z_n) }{ \left|\frac{\partial f}{\partial z}(z_n) \right|^2 - \left|\frac{\partial f}{\partial z^{\ast}}(z_n) \right|^2 } 
$$

検算のために，$f(z)$が正則関数の場合を考える．
このとき，

$$
\frac{\partial f}{\partial z^{\ast}} (z) = 0
$$

であるから，

$$
z_{n+1} = z_{n} - \frac{f(z_n) \frac{\partial f^{\ast}}{\partial z^{\ast}}(z_n) }{ \frac{\partial f}{\partial z}(z_n) \frac{\partial f^{\ast}}{\partial z^{\ast}}(z_n) } = z_{n} - \frac{f(z_n) }{ \frac{\partial f}{\partial z}(z_n) }
$$

というように，よく見る1変数のニュートン法を得る．


## 例

$f(z)=z\lvert z \rvert^2 - 3$という非正則な関数を例にして試してみる．

この関数のゼロ点は3の三乗根$\sqrt[3]{3} \approx 1.4422$である．

ニュートン法に出てくるウィルティンガー微分は次の通りである．

$$
\frac{\partial f}{\partial z} = \left(\frac{\partial f^{\ast}}{\partial z^{\ast}}(z)\right)^{\ast} = 2 |z|^2
$$

$$
\frac{\partial f}{\partial z^{\ast}}(z_n) = \left(\frac{\partial f^{\ast}}{\partial z}(z)\right)^{\ast} = z^2
$$

これを利用すれば更新式は次の通りである．

$$
\begin{align*}
z_{n+1} &= z_n - \frac{(z_n|z_n|^2 - 3)\times 2 |z_n|^2 - (z_n^{\ast}|z_n|^2 - 3) z_n^2}{4|z_n|^4 - |z_n|^4} \\
&= \frac{2}{3} z_n - \frac{z_n - 2z_n^{\ast}}{z_n^{\ast}|z_n|^2}
\end{align*}
$$

適当に$z_0 = 3i$として更新していくと次の通り$\sqrt[3]{3} \approx 1.4422$へ収束していくことがわかる．

$$
\begin{align*}
z_1 &= 0.3333... + 2.0000... i \\
z_2 &= 0.9388... + 1.2544... i \\
z_3 &= 1.5554... + 0.4454... i \\
z_4 &= 1.4768... + 0.0947... i \\
z_5 &= 1.4449... + 0.0048... i \\
z_6 &= 1.4422... + 0.0000... i
\end{align*}
$$
