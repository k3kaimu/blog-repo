---
layout: post
title:  "UHD/USRP用でキャプチャしたデータをFLACで圧縮する"
categories: blog
tags:  blog
author: けーさん/こまたん
mathjax: true
---

UHD/USRPを用いてキャプチャした生のI/Qは大きいため，ハードディスクに保存しておくと容量を食って大変です．
適当にGoogle先生に聞いてみると，FLACで圧縮するとかなり圧縮できるらしいのでやってみました．

<!--more-->

## 実装

入力として`np.complex64`のデータが与えられた場合に，これをFLACで圧縮します．

```py
import numpy as np
import soundfile

# 圧縮関数
def compress_flac(signal, scale=-1):
    if scale < 0:
        scale = 32767

    data = np.array([np.real(signal), np.imag(signal)]).astype(np.float32)
    data *= scale
    data = np.rint(data).astype(np.int16)

    flac_file = io.BytesIO()
    flac_file.name = "file.flac"
    fmt = "FLAC"
    stype = "PCM_16"
    soundfile.write(flac_file, data.T, 44100, format=fmt, subtype=stype)
    flac_file.seek(0)

    header = np.array([scale], dtype=np.float32).tobytes()
    return header + flac_file.read()

# 展開関数
def decompress_flac(data, scale=-1):
    if scale < 0:
        scale = np.frombuffer(data[:4], np.float32)[0]

    data = data[4:]

    flac_file = io.BytesIO()
    flac_file.name = "file.flac"
    flac_file.write(data)
    flac_file.seek(0)
    dst = soundfile.read(flac_file, dtype='int16')[0].T
    dst = dst.astype(np.float32)
    dst = dst[0] + dst[1]*1j
    return dst / scale
```

## パフォーマンス

手元に適当なデータしかないので，ちゃんとした比較などはできませんが，
ZIPなどの適当な圧縮アルゴリズムと比較すると，FLACを用いると半分以下のデータ量になることもありました．
いい感じです．

