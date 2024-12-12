---
layout: post
title:  "ベクトルの微分公式"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

ベクトルでの微分公式を覚えている人はほとんどいないと思います．
私も覚えていません．

今後のために，定義からいろいろ導出する過程を残しておきます．

<!--more-->

<div hidden>
$$
\newcommand{\ABS}[1]{\left|#1\right|}
\newcommand{\brkts}[1]{\left(#1\right)}
\newcommand{\Brkts}[1]{\left\{#1\right\}}
\newcommand{\BRKTS}[1]{\left[#1\right]}
\newcommand{\arctanh}{\mathrm{tanh}^{-1}}
\newcommand{\relmiddle}[1]{\mathrel{}\middle#1\mathrel{}}
% \newcommand{\mathmat}[1]{\mbox{\boldmath $#1$}}
\newcommand{\mathmat}[1]{\boldsymbol{#1}}
\newcommand{\fracpar}[2]{\frac{\partial #1}{\partial #2}}
$$
</div>

## 記法の定義

以下のように行列$\mathmat{A}$の$i$行$j$列要素が$A_{ij}$のとき，次のような記法の定義をしておきます．

$$
\mathmat{A} = \BRKTS{A_{ij}}
$$

行列$\mathmat{A}$の$j$列目縦ベクトルを$\mathmat{c}\_{j}$，
$i$行目の横ベクトルを$\mathmat{r}\_{i}$とすると，以下が成立すると定義します．

$$
\mathmat{A} = \BRKTS{ \mathmat{c}_j } = \BRKTS{ \mathmat{r}_i }
$$

この記法において，次のような関係があります．

$$
\mathmat{A} \mathmat{x} = \BRKTS{ \sum_{k} A_{ik} x_k }
$$

$$
\mathmat{A} \mathmat{B} = \BRKTS{ \sum_{k} A_{ik} B_{kj} }
$$

$$
\mathmat{A} \mathrm{diag}(\mathmat{x}) = \BRKTS{ A_{ij} x_j }
$$

$$
\mathrm{diag}(\mathmat{x}) \mathmat{A}  = \BRKTS{ A_{ij} x_i }
$$

## ベクトルのベクトルでの微分の定義

ベクトルのベクトルでの微分を次のように定義します．

$$
\fracpar{\mathmat{y}}{\mathmat{x}} = \BRKTS{ \fracpar{y_j}{x_i} }
$$


## スカラーのベクトルでの微分

スカラーを1次元ベクトルだと思うと，ベクトルのベクトルでの微分の定義を使って，結果は次のように縦ベクトルになることがわかります．

$$
\fracpar{y}{\mathmat{x}} = \BRKTS{ \fracpar{y}{x_i} }
$$

このスカラーでのベクトル微分を用いると，ベクトルのベクトルでの微分は次のように記述できます．

$$
\fracpar{\mathmat{y}}{\mathmat{x}} = \BRKTS{ \fracpar{y_j}{x_i} } = \BRKTS{ \fracpar{y_j}{\mathmat{x}} }
$$


## ベクトルのスカラーでの微分

こちらは横ベクトルになります．

$$
\fracpar{\mathmat{y} }{x} = \BRKTS{ \fracpar{y_j}{x} }
$$

こちらを使っても，ベクトルのベクトルでの微分を考えることができます．

$$
\fracpar{\mathmat{y}}{\mathmat{x}} = \BRKTS{ \fracpar{y_j}{x_i} } = \BRKTS{ \fracpar{\mathmat{y}}{x_i} }
$$

## いろいろな微分

$$
\begin{align}
\fracpar{}{\mathmat{x}} \mathmat{f} \cdot \mathmat{g} &= \fracpar{}{\mathmat{x}} \mathmat{f}^T \mathmat{g} = \fracpar{}{\mathmat{x}} \mathmat{g}^T \mathmat{f} \\
&= \BRKTS{ \fracpar{}{x_i} \sum_{k} f_k g_k } \\
&=  \BRKTS{ \sum_{k} \fracpar{f_k}{x_i} g_k + \sum_{k} f_k \fracpar{g_k}{x_i} } \\
&= \fracpar{\mathmat{f}}{\mathmat{x}} \mathmat{g} + \fracpar{\mathmat{g}}{\mathmat{x}} \mathmat{f}
\end{align}
$$

$\mathmat{a}$を定数ベクトルとすると，

$$
\begin{align}
\fracpar{}{\mathmat{x}} \mathmat{a} \cdot \mathmat{x} &= \fracpar{}{\mathmat{x}} \mathmat{a}^T \mathmat{x} = \fracpar{}{\mathmat{x}} \mathmat{x}^T \mathmat{a} \\
&= \fracpar{\mathmat{a}}{\mathmat{x}} \mathmat{x} + \fracpar{\mathmat{x}}{\mathmat{x}} \mathmat{a} = \mathmat{a}
\end{align}
$$

$\mathmat{A}$を定数行列とすると，

$$
\begin{align}
\fracpar{}{\mathmat{x}} \mathmat{A} \mathmat{y} &= \BRKTS{ \fracpar{}{x_i} \sum_{k} A_{jk} y_k } \\
&= \BRKTS{ \sum_{k} A_{jk} \fracpar{y_k}{x_i} } \\
&= \BRKTS{ \sum_{k} \fracpar{y_k}{x_i} A^T_{kj}  } = \fracpar{\mathmat{y}}{\mathmat{x}} \mathmat{A}^T
\end{align}
$$

ベクトルを受け取りスカラーを返す関数$f(\mathmat{x})$について，

$$
\begin{align}
\fracpar{f(\mathmat{y})}{\mathmat{x}} &= \BRKTS{ \fracpar{f(y_1,y_2,\cdots,y_n)}{x_i} } \\
&= \BRKTS{ \sum_{k} \fracpar{y_k}{x_i} \fracpar{f}{y_k} } \\
&= \fracpar{\mathmat{y}}{\mathmat{x}} \fracpar{f(\mathmat{y})}{\mathmat{y}}
\end{align}
$$

スカラーを受け取り，スカラーを返す関数$f(x)$について，ベクトル$\mathmat{y}$の各要素に対して$f$を適用したベクトルを$\BRKTS{f(y_i)}$と表記すると，

$$
\begin{align}
\fracpar{}{\mathmat{x}} \BRKTS{ f(y_i) } &= \BRKTS{ \fracpar{f(y_j)}{x_i} } \\
&= \BRKTS{ \fracpar{y_j}{x_i} \fracpar{f(y_j)}{y_j} } = \fracpar{\mathmat{y}}{\mathmat{x}} \mathrm{diag}\brkts{\fracpar{f}{x} (\mathmat{y})}
\end{align}
$$

ベクトルを受け取り，ベクトルを返す関数$\mathmat{f}(\mathmat{y})$について，「ベクトルのベクトルでの微分」と「スカラーのベクトルでの微分」の関係式と，さらに「ベクトルを受け取ってスカラーを返す関数の微分」より，

$$
\begin{align}
\fracpar{\mathmat{f}(\mathmat{y})}{\mathmat{x}} &= \BRKTS{ \fracpar{f_j(\mathmat{y})}{\mathmat{x}} } \\
&= \BRKTS{ \fracpar{\mathmat{y}}{\mathmat{x}} \fracpar{f_j(\mathmat{y})}{\mathmat{y}} } \\
&= \fracpar{\mathmat{y}}{\mathmat{x}} \fracpar{\mathmat{f}(\mathmat{y})}{\mathmat{y}}
\end{align}
$$