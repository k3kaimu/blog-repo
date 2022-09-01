---
layout: post
title:  "C++用のライブラリIT++を使ってD言語でBPSKのシミュレーション"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---


少し前に，ある大学の先生（とはいっても博士号を取ったのは同じ年ですが）をお話していて，
IT++というC++用の信号処理や通信のシミュレーションを書くためのライブラリのお話になりました．

そのときは，自分も数年前にソースコードを読んだりしていたので懐かしいなあ程度に思っていたのですが，
今週が夏休みで暇なので，IT++のクラスなどをD言語から使うラッパーライブラリを作りました．

今日のお昼ごとからやり始めたのでIT++のすべての機能・クラスを網羅できてませんが，
とりあえずBPSKのAWGNでのビット誤り率くらいはシミュレーションできるようになりましたので簡単に紹介します．

<!--more-->


## リポジトリとか

[GitHubのリポジトリ](https://github.com/k3kaimu/itpp-d)にソースコードを公開しています．

WSLのUbuntu 20.04上にLinuxbrew(Homebrew)で入れたIT++でしか動作をテストしていません．
また，コンパイラはclang/ldcのLLVM系でしかテストしていません．

つまり，他の環境では動くかわかりません．


## ビット誤り率のシミュレーションの例

まずは例を示します．
リポジトリの`examples`ディレクトリに置いてある`bpsk_ber_sim.d`をそのまま以下に貼り付けています．

```d
/+ dub.json:
{
	"name": "bpsk_ber_sim",
    "dependencies": {
        "itpp-d": { "path": ".." }
    },
}
+/
module examples.bpsk_ber_sim;

import std.math;
import std.stdio;
import std.range : iota;

import itppd.base.vec;
import itppd.base.random;
import itppd.comm.modulator;

void main()
{
    foreach(EbN0_dB; iota(0, 11)) {
        int N = 1_000_000;
        double N0 = 10.0^^(-EbN0_dB/10.0);

        BPSK bpsk = new BPSK();

        bvec bits, dec_bits;
        vec symbols, rec, noise;
        
        bits = randb(N);

        bpsk.modulate_bits(bits, symbols);

        rec.set_size(N);
        noise = randn(N);

        foreach(i; 0 .. N)
            rec[i] = symbols[i] + sqrt(N0/2) * noise[i];

        bpsk.demodulate_bits(rec, dec_bits);

        size_t cnt;
        foreach(i; 0 .. N)
            if(bits[i] != dec_bits[i])
                ++cnt;
        
        writefln!"%s (dB): %s"(EbN0_dB, cnt * 1.0 / N);
    }
}
```

ソースコードを見てもらえれば分かる通り，基本的には素のIT++と同じです．

このコードをファイルに保存して，以下のように`dub`コマンドでビルドと実行ができます．

```sh
$ dub --single --compiler=ldc2 bpsk_ber_sim.d 
parsePackageRecipe dub.json
Running pre-generate commands for itpp-d...
mkdir: cannot create directory ‘cpptmp’: File exists
/home/linuxbrew/.linuxbrew/bin/clang++
Performing "debug" build using ldc2 for x86_64.
itpp-d ~master: building configuration "library"...
libstdc++ std::__cxx11::basic_string is not yet supported; the struct contains an interior pointer which breaks D move semantics!
bpsk_ber_sim ~master: building configuration "application"...
libstdc++ std::__cxx11::basic_string is not yet supported; the struct contains an interior pointer which breaks D move semantics!
Linking...
Running post-generate commands for itpp-d...
Running bpsk_ber_sim 
0 (dB): 0.078817
1 (dB): 0.056131
2 (dB): 0.037212
3 (dB): 0.023125
4 (dB): 0.012413
5 (dB): 0.005804
6 (dB): 0.002426
7 (dB): 0.000748
8 (dB): 0.000194
9 (dB): 3e-05
10 (dB): 3e-06
```


## itpp-dの細かい話

D言語はC言語やC++とバイナリレベルで互換性を持たせられるため，C言語やC++用のライブラリをゼロコストで利用できます．
よって，C言語やC++のライブラリを利用するためにグルー層となるコードを書く必要は（基本的には）ありません．

ただ，C++におけるヘッダーファイルに相当する部分は自分で記述する必要があります．
（実は今ではC言語のヘッダーファイルについてはD言語に直接取り込めるようになっています）

たとえば，IT++の`itpp/comm/modulator.h`及び``itpp/comm/modulator.cpp``ではBSPK変復調を行うための`class BPSK`が実装されています．
これをD言語から使うために，今回作成したitpp-dでは`source/itppd/comm.modulator.d`の中で以下のように記述しています．


```d
extern(C++, "itpp")
class BPSK : Modulator!double
{
    this()
    {
        Vec!double a = Vec!double("1.0 -1.0");
        ivec b = ivec("0 1");
        super(a, b);
    }

    ~this() {}


    override void modulate_bits(ref const bvec bits, ref vec output) const;
    override vec modulate_bits(ref const bvec bits) const;
    override void demodulate_bits(ref const vec signal, ref bvec output) const;
    override bvec demodulate_bits(ref const vec signal) const;

    override void demodulate_soft_bits(ref const vec rx_symbols, double N0,
                                    ref vec soft_bits,
                                    Soft_Method method = Soft_Method.LOGMAP) const;

    override vec demodulate_soft_bits(ref const vec rx_symbols, double N0,
                           Soft_Method method = Soft_Method.LOGMAP) const;

    override void demodulate_soft_bits(ref const vec rx_symbols,
                                    ref const vec channel, double N0,
                                    ref vec soft_bits,
                                    Soft_Method method = Soft_Method.LOGMAP) const;

    override vec demodulate_soft_bits(ref const vec rx_symbols, ref const vec channel,
                           double N0, Soft_Method method = Soft_Method.LOGMAP) const;
}
```

残念なことに，コンストラクタについては自分で実装する必要がありますが，
それ以外のクラスメソッドについては宣言さえ書けばC++側の実装を呼び出すことができます．

また，D言語側で書く宣言もほとんど`itpp/comm/modulator.h`からのコピペですので，
この`class BPSK`の宣言を書くのは3分くらいで終わります．

もちろん，IT++のクラスを継承したクラスも作ることができます．
実際に上記の例では`Modulator!double`を継承しています．

今回はIT++のクラスをD言語から使っていますが，もちろんD言語側で実装したクラスをIT++（C++）で利用することもできます．
つまり，D言語でIT++を拡張できます．


## なぜD言語から使うのか

趣味です．


## 今後について

現在はBERのシミュレーションくらいしかできませんが，やる気があればもう少し充実させます．．．

