---
layout: post
title:  "期待値伝播法とベクトル近似メッセージ伝播法の比較"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

研究で期待値伝播法（EP）とベクトル近似メッセージ伝播法(VAMP)について勉強したので，
そのまとめを書き起こしておきます．

EPとVAMPは等価だと聞いたことがあるので，本当にそうなのか確認するだけですが．
あと，いろいろ厳密じゃないところや間違ってそうな所あると思いますが．．．

<!--more-->

## 参考文献

* [竹内啓悟，"メッセージ伝播復調法の新展開：期待値伝播法"，IT/SIP/RCS合同研究会，2018年1月．](https://www.ieice.org/ess/sita/forum/article/2018/201801262030.pdf)
* [S. Rangan, P. Schniter, A. K. Fletcher, "Vector Approximate Message Passing", arXiv:1610.03082](https://arxiv.org/abs/1610.03082)


## デノイジング（モジュールB）

軟判定を行う処理です．
VAMPの論文ではAlgorithm 3の4行目から8行目に相当します．
対して，EPでは竹内先生のスライドのp.20-22のモジュールBの記述に相当します．

まず，VAMPでの処理を以下に示します．
ただし，VAMPで$\gamma$として表されている変数はEPでは分散$v$の逆数なので，$\gamma_{(\cdot)}^{-1} = v_{(\cdot)}$として記述しています．

$$
\begin{align}
\hat{\mathbf{x}}_{1k} &= \mathbf{g}_{1}(\mathbf{r}_{1k}, v_{1k}) \\
\alpha_{1k} &= \left< \mathbf{g}'_{1}(\mathbf{r}_{1k}, v_{1k}) \right> \\
v_{2k}^{-1} &= (\alpha_{1k}^{-1} - 1) v^{-1}_{1k} \\
\mathbf{r}_{2k} &= v_{2k} \left( \hat{\mathbf{x}}_{1k}/(\alpha_{1k} v_{1k}) -  \mathbf{r}_{1k}/v_{1k} \right) 
\end{align}
$$

VAMPの論文の式(14)に書いてある通り，$g_1(,)$は事後平均とし，$g_{1}'(,)$は事後分散とします．
つまり

$$
\begin{align}
g_{1}(\mathbf{r}_{1k}, v_{1k}) &= \mathbb{E}\left[\mathbf{x} | \mathbf{r}_{1k}, v_{1k} \right] \\
\left<g_{1}'(\mathbf{r}_{1k}, v_{1k}) \right> &= v_{1k}^{-1} \frac{1}{N} \mathbb{E}\left[|\mathbf{x} - \mathbf{r}_{1k} |^2 | \mathbf{r}_{1k}, v_{1k} \right]
\end{align}
$$

EPとVAMPの式を比較すると，次の関係があることがわかります．

$$
\begin{align}
\hat{\mathbf{x}}_{1k} &= \mathbf{x}_{B}^{t+1} \\
\mathbf{r}_{1k} &= \mathbf{x}_{A \rightarrow B}^t \\
v_{1k} &= v_{A \rightarrow B}^t
\end{align}
$$

また，$v\_{2k}^{-1} = \alpha_{1k}^{-1} v^{-1}\_{1k} - v^{-1}\_{1k}$であり，

$$
\begin{align}
\alpha_{1k} v_{1k} &= v_B^{t+1} \\
v_{2k}^{-1} &= 1/v_B^{t+1} - v^{-1}_{1k} = 1/v_{B \rightarrow A}^{t+1} \\
\mathbf{r}_{2k} &= v_{B \rightarrow A}^{t+1} \left( \frac{\mathbf{x}_{B}^{t+1}}{v_B^{t+1}} - \frac{\mathbf{x}_{A \rightarrow B}^t}{v_{A \rightarrow B}^t} \right) = \mathbf{x}_{B \rightarrow A}^{t+1}
\end{align}
$$

と対応します．
そのため，VAMPのデノイジングの処理は完全にEPのモジュールBの処理に対応します．



## LMMSE推定（モジュールA）

VAMPのLMMSE推定は次のようになっています．

$$
\begin{align}
\hat{\mathbf{x}}_{2k} &= \mathbf{g}_{2}(\mathbf{r}_{2k}, v_{2k}) \\
\alpha_{2k} &= \left< \mathbf{g}'_{2}(\mathbf{r}_{2k}, v_{2k}) \right> \\
v_{1,k+1}^{-1} &= (\alpha_{2k}^{-1} - 1) v^{-1}_{2k} \\
\mathbf{r}_{1,k+1} &= v_{1,k+1} \left( \hat{\mathbf{x}}_{2k}/(\alpha_{2k} v_{2k}) - \mathbf{r}_{2k}/v_{2k} \right) = \left( \hat{\mathbf{x}}_{2k} - \alpha_{2k}\mathbf{r}_{2k} \right)/(1 - \alpha_{2k})
\end{align}
$$

<!-- $g\_2(,)$及び$\left< \mathbf{g}\_{2}'(,) \right>$をそれぞれVAMPの論文の式(24)及び式(25)に書き換えると以下の通りです． -->
まず，$g\_2(,)$をVAMPの論文の式(24)で置き換えます．

$$
\begin{align}
\hat{\mathbf{x}}_{2k} &= \left(v_{w}^{-1} \mathbf{A}^T \mathbf{A} + v_{2k}^{-1} \mathbf{I} \right)^{-1} \left(v_{w}^{-1} \mathbf{A}^T \mathbf{y} + v_{2k}^{-1} \mathbf{r}_{2k} \right) \\
&= \left(\mathbf{A}^T \mathbf{A} + v_{w}/v_{2k} \mathbf{I} \right)^{-1} \mathbf{A}^T \mathbf{y} \\
&+ \left(v_{2k}/v_{w} \mathbf{A}^T \mathbf{A} + \mathbf{I} \right)^{-1} \mathbf{r}_{2k}
\end{align}
$$

ここで，Woodburyの行列反転公式から導出される以下の二つの公式を利用します．

$$
\begin{align}
\left(\mathbf{A}^T \mathbf{A} + v_{w}/v_{2k} \mathbf{I} \right)^{-1} \mathbf{A}^T &= v_{2k} \mathbf{A}^T \left(v_{2k}\mathbf{A}\mathbf{A}^T + v_{w} \mathbf{I} \right)^{-1} \\
\left(v_{2k}/v_{w} \mathbf{A}^T \mathbf{A} + \mathbf{I} \right)^{-1} &= \mathbf{I} - v_{2k} \mathbf{A}^T (v_{w}\mathbf{I} + v_{2k}\mathbf{A}\mathbf{A}^T)^{-1} \mathbf{A}
\end{align}
$$

これらを代入すると，以下のようになりますが，少しだけ$\mathbf{x}\_{A \rightarrow B}^t$とは異なります．

$$
\begin{align}
\hat{\mathbf{x}}_{2k} &= \mathbf{r}_{2k} +  v_{2k} \mathbf{A}^T \left(v_{2k}\mathbf{A}\mathbf{A}^T + v_{w} \mathbf{I} \right)^{-1} \left( \mathbf{y} - \mathbf{A} \mathbf{r}_{2k} \right)
\end{align}
$$

というのも，実際にLMMSEの結果をデノイザーに渡すときには$\mathbf{r}\_{1,k+1}$を経由します．
なので，$\mathbf{r}\_{1,k+1}$を式変形する必要があります．
そのために，次は$\alpha\_{2k}$について，$\left< \mathbf{g}'_{2}(,) \right>$にVAMPの論文の式(25)を代入します．

$$
\begin{align}
\alpha_{2k} = \frac{1}{N} \mathrm{Tr} \left[ \left(v_{2k}/v_{w} \mathbf{A}^T \mathbf{A} +  \mathbf{I} \right)^{-1} \right]
\end{align}
$$

これに先ほど利用した行列の公式を代入します．

$$
\begin{align}
\alpha_{2k} &= \frac{1}{N} \mathrm{Tr} \left[ \mathbf{I} - v_{2k} \mathbf{A}^T (v_{w}\mathbf{I} + v_{2k}\mathbf{A}\mathbf{A}^T)^{-1} \mathbf{A} \right] \\
&= 1 - v_{2k} \frac{1}{N} \mathrm{Tr} \left[ (v_{w}\mathbf{I} + v_{2k}\mathbf{A}\mathbf{A}^T)^{-1} \mathbf{A} \mathbf{A}^T  \right] \\
&= 1 - \frac{v_{2k}}{\gamma(v_{2k})}
\end{align}
$$

ここで，$\gamma(v)$は竹内先生のスライドのp.18で定義されているものです．
これを使って$\mathbf{r}_{1,k+1}$を書き直すと以下のようになります．

$$
\begin{align}
\mathbf{r}_{1,k+1} &= \frac{\gamma(v_{2k})}{v_{2k}} \left( \hat{\mathbf{x}}_{2k} - (1 - \frac{v_{2k}}{\gamma(v_{2k})})\mathbf{r}_{2k} \right) \\
&= \frac{\gamma(v_{2k})}{v_{2k}} \left( \frac{v_{2k}}{\gamma(v_{2k})} \mathbf{r}_{2k} - v_{2k} \mathbf{A}^T \left(v_{2k}\mathbf{A}\mathbf{A}^T + v_{w} \mathbf{I} \right)^{-1} \left( \mathbf{y} - \mathbf{A} \mathbf{r}_{2k} \right) \right) \\
&= \mathbf{r}_{2k} - \gamma(v_{2k}) \mathbf{A}^T \left(v_{2k}\mathbf{A}\mathbf{A}^T + v_{w} \mathbf{I} \right)^{-1} \left( \mathbf{y} - \mathbf{A} \mathbf{r}_{2k} \right)
\end{align}
$$

これで$\mathbf{r}_{1,k+1} = \mathbf{x}\_{A \rightarrow B}^t$が示せました．

また，$v_{1,k+1} = v_{A \rightarrow B}^t$についても次のように式変形することで示せます．

$$
\begin{align}
v_{1,k+1} &= \alpha_{2k} v_{2k}/(1 - \alpha_{2k}) \\
&= \left(1 - \frac{v_{2k}}{\gamma(v_{2k})} \right) v_{2k} \frac{\gamma(v_{2k})}{v_{2k}} \\
&= \gamma(v_{2k}) - v_{2k} = v_{A \rightarrow B}^t
\end{align}
$$


## まとめ

以上のように，VAMPとEPは等価です．
個人的にはEPは簡潔に記述されている点が素敵だと思います．

