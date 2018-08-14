---
layout: post
title:  "deint：シンプルで高精度な数値積分ライブラリ"
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


世の中には専門家が書いた精度保証付きの高機能・高性能な数値積分ライブラリが多数あります．

しかし，実際はそこまで機能・性能を求めていなかったり，関数の形がキレイで積分が簡単だったりで，そのようなライブラリがオーバースペックな場合が結構あります．

しかも，そのようなライブラリは高度な技法を使っているため，専門的な知識がないとコードの理解ができないという問題があります．

でも，自分で台形公式やシンプソン則を書いてもあまり精度が出ないような場合もあります．

そのようなときに役に立つ二重指数関数型積分公式（Double Exponential: DE公式）を用いた数値積分ライブラリ`deint`を少し前に公開しましたので，利用方法を紹介します．

[deintのGitHubリポジトリ](https://github.com/k3kaimu/deint)


## 参考にした記事

この記事では，以下の記事を参考にして自作ライブラリの`deint`の精度を比較します．

* [1] [scipyのquadベンチマーク - Qiita](https://qiita.com/sage-git/items/6a91c65d9a0e44a03dcf)
* [2] [【GSLで数値計算2】二重適応型積分による汎用数値積分を実行しよう！ - Qiita](https://qiita.com/yoggi/items/91253a1383985e611df6)

## `deint`の使い方

ファイルの先頭に次の記述を加えて，`dub --single file.d`でビルド・実行ができます．

```d
/++ dub.json: {
    "dependencies": {
        "deint": "~>0.2.0"
    }
}
+/
```

今後の数値評価では，これに加えて以下のモジュールのimportを仮定しています．

```d
import deint;
import std.math;
import std.stdio;
import std.typecons;

void main()
{
    // ここにコード
}
```

例として，次の積分をしたいとします．

$$
\int_a^b f(x) dx
$$

この積分を`deint`ライブラリでは次のように評価できます．

```d
// 数値積分用のオブジェクトを作る
NumInt!(real, real) de = makeDEInt!real(a, b);

// 数値積分を評価
real I = de.integrate((real x) => f(x));
```

ここで`NumInt!(real, real)`構造体は数値積分で用いる標本点`de.xs`とその重み`de.ws`を格納しています．

デフォルトでは標本点の数`N`は100点となっています．

`NumInt!(real, real).integrate`ではこの標本点と重みを用いて，次のような単純な計算を行います．

$$
I = \sum_{i=0}^{N-1} f(xs[i]) \cdot ws[i]
$$

D言語のコードでは以下のような計算になります．

```d
real sum = 0;
foreach(i; 0 .. xs.length)
    sum += f(xs[i]) * ws[i];
```

`NumInt!(real, real)`構造体は`std.numeric.Fft`のように何度でも再利用可能ですので，一度この構造体を作ってしまえば`deint`ライブラリは単純な処理しか行いません．


## 評価1

以下の積分をデフォルトの分点数（関数の標本点の数）である100点で計算してみます．

$$
\int_{-\infty}^{\infty} \frac{dx}{(x^2+1)^{4}} = \frac{6! \pi}{2^6 (3!)^2}
$$

```d
// 積分区間を指定して数値積分用のオブジェクトを作成
auto de = makeDEInt!real(-real.infinity, real.infinity);

// deオブジェクトを用いて数値積分
auto I = de.integrate((real x) => 1.0L/(x^^2 + 1)^^4);

// 解析解
auto A = PI * (6*5*4*3*2) / (2^^6 * 3*3*2*2);

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

`I`が数値積分解で`A`が解析解です．
この実行結果は次のとおりです．

```
analysis: 0.981748
deint: 0.981748
error: 0
```

`scipy.integrate.quad`と同じく精度良く計算できています．

分点数を16，32，64，128と変えてみましょう．

```d
foreach(N; [16, 32, 64, 128]) {
    // 積分区間と，被積分関数の特徴，分点数を指定
    auto de = makeDEInt!real(
        -real.infinity, real.infinity,
        No.isExpDecay, N);

    auto I = de.integrate((real x) => 1.0L/(x^^2 + 1)^^4);
    auto A = PI * (6*5*4*3*2) / (2^^6 * 3*3*2*2);

    writefln("%s: error = %s", N, abs(I - A));
}
```

実行すると，次の結果を得ます．

```
16: error = 0.126952
32: error = 4.17387e-05
64: error = 3.40776e-15
128: error = 3.79471e-19
```

実用的には64点程度で十分な感じですね．


## 評価2

$$
\int_0^{\infty} \frac{\log(x)}{(x+e)^2} dx = e^{-1}
$$

この関数は[1]でも書かれているとおり，$$x=0$$で発散しますので，単純な数値積分法だとまともに計算できないでしょう．

`deint`では次のように評価できます．

```d
auto de = makeDEInt!real(0, real.infinity);
auto I = de.integrate((real x) => log(x)/(x + E)^^2);

auto A = 1/E;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

```
analysis: 0.367879
deint: 0.367879
error: 2.71051e-20
```

[1]で報告されている`scipy.integrate.quad`の結果よりも精度良く計算できています．

この結果についても分点数を変えてみると次のような結果を得ます．

```d
16: error = 0.000387186
32: error = 1.47085e-09
64: error = 2.71051e-20
128: error = 8.13152e-20
```

この積分も64点程度で良さそうです．


## 評価3

$$
\int_{-\infty}^{\infty} \exp(-x^2) \cos(2x) = \sqrt{\pi} e^{-1}
$$

このような形の積分では，DE公式では3通りの積分方法があります．

### 単純な両無限区間積分として

まずは積分が次のように両無限区間のときの方法で評価してみます．

$$
\int_{-\infty}^{\infty} f(x) dx
$$

コードと結果は次のとおりです．

```d
auto de = makeDEInt!real(-real.infinity, real.infinity);
auto I = de.integrate((real x) => exp(-x^^2)*cos(2*x));

auto A = sqrt(PI)/E;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

```
analysis: 0.652049
deint: 0.652049
error: 3.83249e-07
```

デフォルトの100点では少し精度的に悪いみたいです．

分点数を変えて評価してみます．

```
16: error = 0.159767
32: error = 0.0312123
64: error = 6.82312e-08
128: error = 2.54893e-09
256: error = 1.68106e-16
512: error = 4.33681e-19
```

256点くらいは必要なようです．


### 指数減衰関数として

積分領域を2つの半無限区間$$(-\infty, 0), (0, \infty)$$に分けて積分します．

半無限区間で指数減衰する関数の積分を2回評価することになるので，次のように積分できます．

偶関数なので2倍してもいいですが，ここでは公平性を保つために2回評価して足します．

```d
auto de1 = makeDEInt!real(-real.infinity, 0, Yes.isExpDecay, 50);
auto de2 = makeDEInt!real(0, real.infinity, Yes.isExpDecay, 50);
auto I1 = de1.integrate((real x) => exp(-x^^2)*cos(2*x));
auto I2 = de2.integrate((real x) => exp(-x^^2)*cos(2*x));

auto I = I1 + I2;

auto A = sqrt(PI)/E;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

```
analysis: 0.652049
deint: 0.65205
error: 4.07511e-07
```

```
16: error = 0.999147
32: error = 0.112139
64: error = 0.000543632
128: error = 1.97835e-09
256: error = 2.71051e-19
512: error = 2.1684e-19
```

やはり100点ではあまり精度的に良くなく，256点くらいは必要そうです．


### フーリエ型（振動型）積分として

半無限区間で`sin`か`cos`で変調されている関数のときは，`makeDEIntFourier`という関数を使います．

この関数は今まで使ってきた`makeDEInt`と違って，刻み幅と正と負の分点数を与える必要があります．

デフォルトでは刻み幅は`0.1`，負の分点数が`49`，正の分点数が`50`で，ゼロを含めると全体の分点数は100点です．

刻み幅の大体の目安ですが，分点数を`N`とすると`10/N`程度が良い感じです．

公正な評価のために片側あたり50点ずつ与えたいので，負側24点，正側25点与えてみます．

```d
auto de1 = makeDEIntFourier!real(No.isSine, 2, 0.2, 24, 25);
auto de2 = makeDEIntFourier!real(No.isSine, 2, 0.2, 24, 25);
auto I1 = de1.integrate((real x) => exp(-x^^2)*cos(2*x));
auto I2 = de2.integrate((real x) => exp(-x^^2)*cos(-2*x));

auto I = I1 + I2;

auto A = sqrt(PI)/E;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

```
analysis: 0.652049
deint: 0.652049
error: 2.57791e-07
```

まあまあという感じです．

分点数を変えると，128点以上で精度が悪くなってしまいました．
たぶん実装が悪いんだと思います．

```d
16: error = 0.150722
32: error = 0.00539355
64: error = 6.32138e-05
128: error = 1.32235e-10
256: error = 2.40555e-07
512: error = 1.54049e-05
```


**追記（2018年8月14日）**

関数の形が$$\exp(-x^2)$$で減衰しているので，標本点は負方向に集中的に配置し，ステップサイズも微調整しました．

```d
size_t nlow = N/2-10-1;
auto de1 = makeDEIntFourier!real(No.isSine, 2, 8.0L/nlow, nlow, 10);
auto de2 = makeDEIntFourier!real(No.isSine, 2, 8.0L/nlow, nlow, 10);

// ...
```

すると，以下の通り誤差を減少できました．


```
32: error = 0.232414
64: error = 0.000493887
128: error = 1.71189e-09
256: error = 1.0842e-19
512: error = 5.42101e-20
```


## 評価4

$$
PV \int_{-\infty}^{\infty} \frac{dx}{x^3 -x^2+x-1} = - \frac{\pi}{2}
$$

[1]でも書かれているように被積分関数は$$x=1$$で発散します．

なので，$$x=1$$を避けて2つの領域で積分します．
また，デフォルトのままだと$$x=1$$のすごく近くまで評価しようとしてしまうので，追加の引数として$$-3, 3$$という値を与えます．

```d
auto de1 = makeDEInt!real(-real.infinity, 1, No.isExpDecay, 50, -3, 3);
auto de2 = makeDEInt!real(1, real.infinity, No.isExpDecay, 50, -3, 3);
auto I1 = de1.integrate((real x) => 1/(x^^3 - x^^2 + x - 1));
auto I2 = de2.integrate((real x) => 1/(x^^3 - x^^2 + x - 1));

auto I = I1 + I2;

auto A = -PI/2;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

```
analysis: -1.5708
deint: -1.5708
error: 4.57971e-08
```

[1]の`scipy`の例ではオプションを変えても`1E-7`程度であったことを考慮すれば，同等な精度でいい感じです．

今回追加で与えた`-3, 3`という引数はDE公式で変数変換したあとの積分範囲を表します．

詳しく説明すると，DE公式では積分を変数変換して両無限区間の積分に変換します．

$$
I = \int_{a}^{b} f(x) dx = \int_{-\infty}^{\infty} f(\phi(t)) \phi'(t) dt
$$

変換後の積分は両無限区間ですので，数値積分するときにはどこかで区切る必要があります．
この区切る範囲がデフォルトでは`(-5, 5)`であり，今回は`(-3, 3)`を与えたのでした．

この値の絶対値を大きくすればするほど積分の端点に近いところまで評価します．

逆に，今回のように端点で発散する場合には区間を小さくして発散している領域を避けます．

目安としては$$(-5, 5)$$でダメなら$$(-4, 4)$$や$$(-3, 3)$$を試すといいと思います．


## 評価5

$$
\int_{0}^{\infty} \frac{\sin(x)}{x} dx = \frac{\pi}{2}
$$

振動型で減衰が緩やかなので，単純な数値積分ライブラリでは結構難しいのではないでしょうか？

[1]では`scipy.integrate.quad`の評価結果が乗っていますが，`scipy`では誤差`1E-6`を得るために10秒程度かかるようで，結構つらそうです．

`deint`では次のように評価できます．

```d
import std.datetime.stopwatch: StopWatch;
StopWatch sw;

sw.start();

auto de = makeDEIntFourier!real(Yes.isSine, 1, 0.1, 99, 100);
auto I = de.integrate((real x) => sin(x)/x);

sw.stop();

auto A = PI/2;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
writeln("time: ", sw.peek);
```

```
analysis: 1.5708
deint: 1.5708
error: 4.33681e-19
time: 90 μs
```

`deint`では90マイクロ秒で`1E-18`程度の誤差と，`scipy`に比べれば`deint`の方がすごく優秀なのがわかります．



## 評価6

最後に`deint`がわりと苦戦する積分例を示します．
この例は[2]でGSLの`gsl_integration_cquad`関数で誤差`2E-11`程度で評価されている例です．

$$
\int_{0}^{1} \frac{\log(x)}{\sqrt{x}} dx = -4
$$

この積分は$$x=0$$で発散します．

ちなみに，`scipy.integrate.quad`だと`8E-14`程度の誤差で評価できます．

`deint`だと，デフォルトの区間$$(-5, 5)$$では発散してしまうため$$(-3.3, 3)$$を与えて，次のように評価できます．

```d
auto de = makeDEInt!real(0, 1, No.isExpDecay, 100, -3.3, 3);
auto I = de.integrate((real x) => log(x)/sqrt(x));

auto A = -4;

writeln("analysis: ", A);
writeln("deint: ", I);
writeln("error: ", abs(I - A));
```

```
analysis: -4
deint: -4
error: 1.71968e-08
```

誤差は`1E-8`程度とわりと厳しい感じです．

分点数を増やしたりしてもそんなに誤差は減少しませんし，区間は`-3.3`よりも小さくすると発散してしまうので，`deint`ではこれが限界みたいです．



## まとめ

`deint`は素人が作った数値積分ライブラリですが，scipyやGSLとわりといい勝負ができる精度で数値積分ができます．

また，1次元の数値積分であれば`deint`の方が圧倒的に軽量だと思います．

実装コード量についても，`makeDEInt`は約100行程度で実装しているので，単純なことがわかります．

(まあ，DE公式が非常に優秀なだけで，たぶん誰がDE公式を実装しても同じような精度になると思います．)

ちょっと積分してみたいな，というときに使ってみてください．

