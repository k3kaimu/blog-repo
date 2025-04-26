---
layout: post
title:  "Turing CompleteでClashの勉強をしてCPUを作る"
categories: blog
tags:  blog
author: けーさん/こまたん
---


HaskellでRTL記述のHDLがかけるClashというものがあります．
Verilogとかを勉強しなくてもHaskellの高情報量の構文で記述すれば，それをVerilogなどのHDLに変換できます．

今回はClashでRTL記述を書く勉強として，Turing CompleteというSteamゲームで出てくる課題？を解いていきます．
ちなみに私はHaskellについてもHDLとかRTL記述についてもほとんどわかっていませんので，本当に初心者として勉強する目的です．
特にHaskellの書き方についてはまっっっったく洗練されてないと思いますが許してください．
（Copilotにものすごい助けを借りています．こういう勉強に本当に便利だと思います）

<!--more-->

ちなみに，Turing CompleteはSteamで売っていますが本当におもしろいゲームですのでおすすめです．
ゲームで宇宙人から出される課題をクリアしていくとCPUが出来上がってきて，最終的には自分で定義した関数を使ったり，プログラミングまでできるようになります．


## 準備

Haskellのビルドツールであるstackをインストールして以下を実行すれば最小限の構成のプロジェクトを作ってくれる．

```sh
$ stack new {ディレクトリ名} clash-lang/simple
```

あとはできたディレクトリの中に入っている`README.md`を読めばわかるはず．

たとえばVerilogへの変換は以下のようにする．

```sh
$ stack run clash -- Example.Project --verilog
```

テストは`tests/Test/Example/Project.hs`に追加して，以下のコマンドで実行する感じ．

```sh
$ stack test
```

## Arithmetic Engine

演算の種類を表す3ビットの値と，演算器への二つの入力を受け取って，演算結果を返す回路を作れと宇宙人から脅される回です．
Haskellのパターンマッチを使うことで簡単に書くことができます．

```hs
alu :: (Bits a, Num a) => BitVector 3 -> a -> a -> a
alu op x y = case op of
  0 -> x .|. y                            -- OR
  1 -> complement (x .&. y)               -- NAND
  2 -> complement (x .|. y)               -- NOR
  3 -> x .&. y                            -- AND
  4 -> x + y                              -- ADD
  5 -> x - y                              -- SUB
  _ -> x
```

ちなみにテストはこんな感じ．

```hs
prop_alu :: H.Property
prop_alu = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 255))
  y <- H.forAll (Gen.integral (Range.linear 0 255))

  let
    z000 = alu 0b000 x y :: BitVector 8
    z001 = alu 0b001 x y :: BitVector 8
    z010 = alu 0b010 x y :: BitVector 8
    z011 = alu 0b011 x y :: BitVector 8
    z100 = alu 0b100 x y :: BitVector 8
    z101 = alu 0b101 x y :: BitVector 8
    e000 = x .|. y
    e001 = complement (x .&. y)
    e010 = complement (x .|. y)
    e011 = x .&. y
    e100 = x + y
    e101 = x - y
  z000 H.=== e000
  z001 H.=== e001
  z010 H.=== e010
  z011 H.=== e011
  z100 H.=== e100
  z101 H.=== e101
```

また，`alu`は以下のようにも書けます．

```hs
alu :: (Bits a, Num a) => BitVector 3 -> a -> a -> a
alu $(bitPattern "0ab") x y = if a == 0 then z else complement z
  where
    z = x' .|. y'
    x' = if b == 0 then x else complement x
    y' = if b == 0 then y else complement y

alu $(bitPattern "10a") x y = x + (if a == 0 then y else negate y)
alu _ x _ = x
```

これから何回も使いますが，`bitPattern`が便利で，`$(bitPattern "0ab")`だと3ビット目が`0`の場合は1ビット目を変数`b`，2ビット目を変数`a`に束縛してくれます．
先に示した書き方よりこっちのほうが使うリソースが少なそうだけど，たぶんどうせ賢いCADツールが最適化してくれるので変わらないんだろうな．．．と思いつつ．．．


## Register

飛ばします（後で実装）

## Component Factory

今回は関係ないのでOK

## Instruction Decoder

8ビットの命令の上位2ビットの値に応じてImmediate, Calculate, Copy, Conditionの四つの命令にデコードする処理です．
とりあえずこの段階では上位2ビットの値のみを見ますので，下部6ビットについては後で実装することになります．

まず四つの命令に対応した`Instruction`を定義しています．
`Generic`，`NFDataX`，`Show`，`Eq`あたりはとりあえずつけておけばいいっぽい．
まあ，`Generic`と`NFDataX`あたりは何なのか全く意味がわかっていませんが．

そして，`BitVector 8`から`Instruction`へ変換するような`decodeInst`関数を`bitPattern`を使って作りました．
`bitPattern`で`"00......"`のように`.`はドントケアを意味しています．

```hs
data Instruction = Imme | Calc | Copy | Cond
  deriving (Generic, NFDataX, Show, Eq)

decodeInst :: BitVector 8 -> Instruction
decodeInst x = case x of
  $(bitPattern "00......") -> Imme
  $(bitPattern "01......") -> Calc
  $(bitPattern "10......") -> Copy
  $(bitPattern "11......") -> Cond
```

テストは以下のような感じ．
任意の6ビット値（0～63）に対して先頭に`00`から`11`を付与した値を`decodeInst`に与えた結果が正しいかを判定しています．

```hs
prop_decodeInst = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 63))

  let
    x' = x :: BitVector 6
    z00 = decodeInst (0b00 ++# x')
    z01 = decodeInst (0b01 ++# x')
    z10 = decodeInst (0b10 ++# x')
    z11 = decodeInst (0b11 ++# x')
  z00 H.=== Imme
  z01 H.=== Calc
  z10 H.=== Copy
  z11 H.=== Cond
```

### Calculation

レジスタ間でのコピーをするCopy命令と，レジスタ間で計算をするCalculate命令を実装しろという課題です．
また，先ほど作った`Instruction`や`decodeInst`にも手を加えます．

```hs
data Instruction = Imme | Calc (BitVector 3) | Copy (BitVector 3) (BitVector 3) | Cond
  deriving (Generic, NFDataX, Show, Eq)

decodeInst :: BitVector 8 -> Instruction
decodeInst x = case x of
  $(bitPattern "00......") -> Imme
  $(bitPattern "01...aaa") -> Calc aaa
  $(bitPattern "10aaabbb") -> Copy aaa bbb
  $(bitPattern "11......") -> Cond
```

さらにテストも修正します．

```hs
prop_decodeInst = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 63))

  let
    x' = x :: BitVector 6
    (a, b) = split x
    z00 = decodeInst (0b00 ++# x')
    z01 = decodeInst (0b01 ++# x')
    z10 = decodeInst (0b10 ++# x')
    z11 = decodeInst (0b11 ++# x')
  z00 H.=== Imme
  z01 H.=== Calc b
  z10 H.=== Copy a b
  z11 H.=== Cond
```

次に，Registerの課題をすっ飛ばしたので，まずは`CPUState`というデータ型を定義して，そこで6個のレジスタを定義します．

```hs
data CPUState = CPUState { regs :: Vec 6 (BitVector 8) }
  deriving (Generic, NFDataX, Show, Eq, Default)
```

そうすると，これから作るCPUは次のような関数で定義できます．

```hs
cpu :: (HiddenClockResetEnable dom) =>
  Signal dom (BitVector 8) ->       -- 命令
  Signal dom (BitVector 8) ->       -- 外部からの入力
  Signal dom (Maybe (BitVector 8))  -- 外部への出力
cpu inst input = mealyB (\s (x, y) -> execute (decodeInst x) s y ) def (inst, input)
```

なお．`mealyB`というのは`mealy`と`bundle`の組み合わせですが，`mealy`は状態遷移を表す関数と初期状態及び入力を受け取って，順序回路を作る関数です．
まさに，状態がレジスタで，状態遷移を表す関数がレジスタ間をつなぐ組み合わせ論理回路になっている感じです．たぶん．

それでは，CPUの状態遷移を表す関数として，`Instruction`と`CPUState`と外部からの入力値を受け取って，更新した`CPUState`と出力値を返す関数`execute`を作ります．

```hs
execute :: Instruction -> CPUState -> BitVector 8 -> (CPUState, Maybe (BitVector 8))
execute (Calc op) state input = (state { regs = replace 3 (alu op (regs !! 1) (regs !! 2)) regs }, Nothing) where CPUState { .. } = state
execute (Copy src dst) state input = (newState, output)
  where
    CPUState { .. } = state
    srcval = (regs ++ (input :> 0 :> Nil)) !! src
    output = if dst == 0b110 then Just srcval else Nothing
    newState = if dst == 0b110 then state else state { regs = replace dst srcval regs }
```

`execute`のテストはこんな感じ．
CalcとCopyで分けました．

```hs
prop_execute_calc = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 255))
  y <- H.forAll (Gen.integral (Range.linear 0 255))
  op <- H.forAll (Gen.integral (Range.linear 0 5))

  let
    init = CPUState { regs = replace 2 y $ replace 1 x def }
    (result_calc, result_output) = execute (Calc op) init 0
    expected = CPUState { regs = replace 3 (alu op x y) $ regs init }
  result_calc H.=== expected
  result_output H.=== Nothing


prop_execute_copy = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 255))
  y <- H.forAll (Gen.integral (Range.linear 0 255))
  src <- H.forAll (Gen.integral (Range.linear 0 6))
  dst <- H.forAll (Gen.integral (Range.linear 0 6))

  let
    init = CPUState { regs = if src < 6 then replace src x def else def }
    (result_state, result_output) = execute (Copy src dst) init y
    expected_state = if dst < 6 then CPUState { regs = replace dst (if src < 6 then x else y) $ regs init } else init
    expected_output = if dst == 6 then Just (if src < 6 then x else y) else Nothing
  result_state H.=== expected_state
  result_output H.=== expected_output
```

ちなみに，ここまでできると，自作のCPUのHDLを生成できます．
まずは，`topEntity`という関数を以下のように定義します．

```hs
topEntity ::
  Clock System ->
  Reset System ->
  Enable System ->
  Signal System (BitVector 8) ->
  Signal System (BitVector 8) ->
  Signal System (Maybe (BitVector 8))
topEntity = exposeClockResetEnable cpu
```

そして以下のコマンドでVerilogに変換してみます．

```sh
$ stack run clash -- Example.Project --verilog
```

生成されたVerilogのHDLコードは`verilog/Example.Project.topEntity`に配置されます．
今回は以下のようなものが生成されました．

```verilog
/* AUTOMATICALLY GENERATED VERILOG-2001 SOURCE CODE.
** GENERATED BY CLASH 1.8.2. DO NOT MODIFY.
*/
`default_nettype none
`timescale 100fs/100fs
module topEntity
    ( // Inputs
      input wire  eta // clock
    , input wire  eta1 // reset
    , input wire  eta2 // enable
    , input wire [7:0] eta4
    , input wire [7:0] eta5

      // Outputs
    , output wire [8:0] result
    );
  wire [7:0] result_1;
  wire [7:0] result_2;
  wire [7:0] c$case_alt;
  wire [7:0] c$case_alt_0;
  wire [1:0] c$decodeInst_$j_$j1_arg1;
  wire [2:0] result_3;
  wire [1:0] c$decodeInst_$j_$j1_arg1_0;
  wire [2:0] result_4;
  wire [0:0] c$decodeInst_$j_arg1;
  wire [0:0] c$decodeInst_$j_arg1_case_alt;
  wire [7:0] c$decodeInst_$j_arg1_app_arg;
  reg [56:0] result_5;
  wire [8:0] c$app_arg;
  wire [47:0] c$app_arg_0;
  wire  c$case_scrut;
  wire [47:0] c$app_arg_1;
  wire [7:0] srcval;
  wire [2:0] dst;
  wire [2:0] src;
  wire [47:0] c$app_arg_2;
  wire [7:0] result_6;
  wire [7:0] c$case_alt_1;
  wire [7:0] result_7;
  wire [7:0] result_8;
  wire [7:0] c$z_app_arg;
  wire [7:0] c$z_app_arg_0;
  wire  c$z_case_scrut;
  wire [0:0] b;
  wire [7:0] c$app_arg_3;
  wire  c$case_scrut_0;
  wire [2:0] op;
  wire [7:0] c$app_arg_4;
  wire [7:0] c$app_arg_5;
  reg [47:0] s = {8'd0,   8'd0,   8'd0,   8'd0,   8'd0,   8'd0};
  wire [47:0] c$vec;
  wire [63:0] c$vecFlat;
  wire [47:0] c$vec_0;
  wire [47:0] c$vec_1;
  wire [47:0] c$vec_2;

  assign result_1 = (c$decodeInst_$j_arg1_app_arg == 8'b00000000) ? {2'b00,6'bxxxxxx} : result_2;

  assign result_2 = (c$decodeInst_$j_arg1_app_arg == 8'b01000000) ? {2'b01,result_4,3'bxxx} : c$case_alt;

  assign c$case_alt = (c$decodeInst_$j_arg1_app_arg == 8'b10000000) ? {2'b10,result_3,result_4} : c$case_alt_0;

  assign c$case_alt_0 = (c$decodeInst_$j_arg1_app_arg == 8'b11000000) ? {2'b11,6'bxxxxxx} : ({8 {1'bx}});

  assign c$decodeInst_$j_$j1_arg1 = ((eta4[(64'sd4)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_arg1}) : ({1'b0,c$decodeInst_$j_arg1});

  assign result_3 = ((eta4[(64'sd5)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_arg1}) : ({1'b0,c$decodeInst_$j_$j1_arg1});

  assign c$decodeInst_$j_$j1_arg1_0 = ((eta4[(64'sd1)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_arg1_case_alt}) : ({1'b0,c$decodeInst_$j_arg1_case_alt});

  assign result_4 = ((eta4[(64'sd2)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_arg1_0}) : ({1'b0,c$decodeInst_$j_$j1_arg1_0});

  assign c$decodeInst_$j_arg1 = ((eta4[(64'sd3)]) == (1'b1)) ? 1'b1 : 1'b0;

  assign c$decodeInst_$j_arg1_case_alt = ((eta4[(64'sd0)]) == (1'b1)) ? 1'b1 : 1'b0;

  assign c$decodeInst_$j_arg1_app_arg = 8'b11000000 & eta4;

  always @(*) begin
    case(result_1[7:6])
      2'b01 : result_5 = {c$app_arg_2,
                          {1'b0,8'bxxxxxxxx}};
      2'b10 : result_5 = {c$app_arg_0,   c$app_arg};
      default : result_5 = {57 {1'bx}};
    endcase
  end

  assign c$app_arg = c$case_scrut ? {1'b1,srcval} : {1'b0,8'bxxxxxxxx};

  assign c$app_arg_0 = c$case_scrut ? s : c$app_arg_1;

  assign c$case_scrut = dst == 3'b110;

  assign c$vec = s;

  // vector replace begin
  genvar i;
  generate
  for (i=0;i<6;i=i+1) begin : vector_replace
    assign c$app_arg_1[(5-i)*8+:8] = ($unsigned({ {(64-3) {1'b0}},dst})) == i ? srcval : c$vec[(5-i)*8+:8];
  end
  endgenerate
  // vector replace end

  assign c$vecFlat = ({s,{eta5,   8'b00000000}});

  // index begin
  wire [7:0] vecArray [0:8-1];
  genvar i_0;
  generate
  for (i_0=0; i_0 < 8; i_0=i_0+1) begin : mk_array
    assign vecArray[(8-1)-i_0] = c$vecFlat[i_0*8+:8];
  end
  endgenerate
  assign srcval = vecArray[($unsigned({ {(64-3) {1'b0}},src}))];
  // index end

  assign dst = result_1[2:0];

  assign src = result_1[5:3];

  assign c$vec_0 = s;

  // vector replace begin
  genvar i_1;
  generate
  for (i_1=0;i_1<6;i_1=i_1+1) begin : vector_replace_0
    assign c$app_arg_2[(5-i_1)*8+:8] = (64'sd3) == i_1 ? result_6 : c$vec_0[(5-i_1)*8+:8];
  end
  endgenerate
  // vector replace end

  assign result_6 = ((3'b100 & op) == 3'b000) ? result_7 : c$case_alt_1;

  assign c$case_alt_1 = ((3'b110 & op) == 3'b100) ? (c$app_arg_5 + c$app_arg_3) : c$app_arg_5;

  assign result_7 = ((op[(64'sd1)]) == (1'b1)) ? (~ result_8) : result_8;

  assign result_8 = c$z_app_arg_0 | c$z_app_arg;

  assign c$z_app_arg = c$z_case_scrut ? c$app_arg_4 : (~ c$app_arg_4);

  assign c$z_app_arg_0 = c$z_case_scrut ? c$app_arg_5 : (~ c$app_arg_5);

  assign c$z_case_scrut = b == 1'b0;

  assign b = c$case_scrut_0 ? 1'b1 : 1'b0;

  assign c$app_arg_3 = c$case_scrut_0 ? (-c$app_arg_4) : c$app_arg_4;

  assign c$case_scrut_0 = (op[(64'sd0)]) == (1'b1);

  assign op = result_1[5:3];

  assign c$vec_1 = s;

  // index lit begin
  assign c$app_arg_4 = c$vec_1[48-1-2*8 -: 8];
  // index lit end

  assign c$vec_2 = s;

  // index lit begin
  assign c$app_arg_5 = c$vec_2[48-1-1*8 -: 8];
  // index lit end

  assign result = result_5[8:0];

  // register begin
  always @(posedge eta or  posedge  eta1) begin : s_register
    if ( eta1) begin
      s <= {8'd0,   8'd0,   8'd0,   8'd0,   8'd0,   8'd0};
    end else if (eta2) begin
      s <= result_5[56:9];
    end
  end
  // register end


endmodule
```

読めない．
わからない．

まあ，Clashでのテストは問題なかったので大丈夫でしょう．


## Conditions

入力値が条件に合うかどうかを判定する回路を作ります．

```hs
checkCond :: BitVector 3 -> BitVector 8 -> Bool
checkCond $(bitPattern "abc") x = if a == 0 then r0 else not r0
  where
    r0 = r1 || r2
    r1 = if b == 0 then False else x < 0
    r2 = if c == 0 then False else x == 0
```

以下はテストです．

```hs
prop_checkCond = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 255))

  let
    r000 = checkCond 0b000 x
    d000 = False
    r001 = checkCond 0b001 x
    d001 = x == 0
    r010 = checkCond 0b010 x
    d010 = x < 0
    r011 = checkCond 0b011 x
    d011 = x <= 0
    r100 = checkCond 0b100 x
    d100 = True
    r101 = checkCond 0b101 x
    d101 = x /= 0
    r110 = checkCond 0b110 x
    d110 = x >= 0
    r111 = checkCond 0b111 x
    d111 = x > 0
  r000 H.=== d000
  r001 H.=== d001
  r010 H.=== d010
  r011 H.=== d011
  r100 H.=== d100
  r101 H.=== d101
  r110 H.=== d110
  r111 H.=== d111
```



## Program

CPUにプログラム用のROMとプログラムカウンタを追加することになります．
さっき作った条件判定器はまだ使わない．

まずは`CPUState`にプログラムカウンタを追加しときます．

```hs
data CPUState = CPUState { pc :: Unsigned 8, regs :: Vec 6 (BitVector 8) }
  deriving (Generic, NFDataX, Show, Eq, Default)
```

次に，`execute`と`cpu`を少し書き換えるわけですが，`cpu`は命令を`Signal dom (BitVector 8)`で受け取るのではなく`Vec n (BitVector 8)`で受け取って，あとはそれを`asyncRom`に入れておいけばいいんだろうか．
`asyncRom`からはプログラムカウンタに従って読み取ればOK．
そこから出てくる値を`decodeInst`してから`execute`に渡せばいけるはず．

プログラムカウンタの値が命令の個数よりも多い場合はそれ以上何もしないようにCPUが停止するようにしました．

```hs
cpu :: (HiddenClockResetEnable dom, KnownNat n) =>
  Vec n (BitVector 8) ->            -- 命令
  Signal dom (BitVector 8) ->       -- 外部からの入力
  Signal dom (Maybe (BitVector 8))  -- 外部への出力
cpu insts input = mealyB fn def input
  where
    fn s x = if (pc s) < (fromIntegral $ length insts)
      then execute (decodeInst $ asyncRom insts $ pc s) s x
      else (s, Nothing)
```

`execute`は以下のようになります．
基本的には`pc`を毎回インクリメントするように変更するだけです．

```hs
execute :: Instruction -> CPUState -> BitVector 8 -> (CPUState, Maybe (BitVector 8))
execute (Calc op) state input = (state { pc = pc + 1, regs = replace 3 (alu op (regs !! 1) (regs !! 2)) regs }, Nothing) where CPUState { .. } = state
execute (Copy src dst) state input = (newState, output)
  where
    CPUState { .. } = state
    srcval = (regs ++ (input :> 0 :> Nil)) !! src
    output = if dst == 0b110 then Just srcval else Nothing
    newState = if dst == 0b110 then state { pc = pc + 1 } else state { pc = pc + 1, regs = replace dst srcval regs }
```

テストも同じような変更になります．

```hs
prop_execute_calc = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 255))
  y <- H.forAll (Gen.integral (Range.linear 0 255))
  op <- H.forAll (Gen.integral (Range.linear 0 5))

  let
    init = CPUState { pc = 0, regs = replace 2 y $ replace 1 x def }
    (result_calc, result_output) = execute (Calc op) init 0
    expected = CPUState { pc = 1, regs = replace 3 (alu op x y) $ regs init }
  result_calc H.=== expected
  result_output H.=== Nothing


prop_execute_copy = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 255))
  y <- H.forAll (Gen.integral (Range.linear 0 255))
  src <- H.forAll (Gen.integral (Range.linear 0 6))
  dst <- H.forAll (Gen.integral (Range.linear 0 6))

  let
    init = CPUState { pc = 0, regs = if src < 6 then replace src x def else def }
    (result_state, result_output) = execute (Copy src dst) init y
    expected_state = if dst < 6 then CPUState { pc = 1, regs = replace dst (if src < 6 then x else y) $ regs init } else init { pc = 1}
    expected_output = if dst == 6 then Just (if src < 6 then x else y) else Nothing
  result_state H.=== expected_state
  result_output H.=== expected_output
```

`topEntity`の修正はこんな感じで`myProgram`っていう命令のリストを定義しておいてそれを`cpu`に渡します．

```hs
myProgram = 0b0000000 :> Nil

topEntity ::
  Clock System ->
  Reset System ->
  Enable System ->
  Signal System (BitVector 8) ->
  Signal System (Maybe (BitVector 8))
topEntity = exposeClockResetEnable $ cpu myProgram
```


## Immediate Values

executeにImmediate命令を実装します．
まずは`Instruction`と`decodeInst`をImmeに対応させます．

```hs
data Instruction = Imme (BitVector 6) | Calc (BitVector 3) | Copy (BitVector 3) (BitVector 3) | Cond (BitVector 3)
  deriving (Generic, NFDataX, Show, Eq)

decodeInst :: BitVector 8 -> Instruction
decodeInst x = case x of
  $(bitPattern "00aaaaaa") -> Imme aaaaaa
  $(bitPattern "01...aaa") -> Calc aaa
  $(bitPattern "10aaabbb") -> Copy aaa bbb
  $(bitPattern "11...aaa") -> Cond aaa
```

テストはこんな感じ．

```hs
prop_decodeInst = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 63))

  let
    x' = x :: BitVector 6
    (a, b) = split x
    z00 = decodeInst (0b00 ++# x')
    z01 = decodeInst (0b01 ++# x')
    z10 = decodeInst (0b10 ++# x')
    z11 = decodeInst (0b11 ++# x')
  z00 H.=== Imme x'
  z01 H.=== Calc b
  z10 H.=== Copy a b
  z11 H.=== Cond
```

次に`execute`にImmediate命令を追加します．

```hs
execute (Imme value) state _ = (state { pc = (pc state) + 1, regs = replace 0 (resize value) $ regs state }, Nothing)
```

テストは以下のような感じ．

```hs
prop_execute_immediate = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 63))

  let
    init = CPUState { pc = 0, regs = def }
    (result_state, result_output) = execute (Imme x) init 0
    expected_state = CPUState { pc = 1, regs = replace 0 (resize x) def }
  result_state H.=== expected_state
  result_output H.=== Nothing
```


## Turing Complete

Conditionモードを自作CPUに追加します．
Conditionモードでは，`regs !! 3`の値が条件に一致したら`regs !! 0`の値をプログラムカウンタに入れて，それ以外の場合はプログラムカウンタをインクリメントします．
まずは`Instruction`と`decodeInst`の修正．

```hs
data Instruction = Imme (BitVector 6) | Calc (BitVector 3) | Copy (BitVector 3) (BitVector 3) | Cond (BitVector 3)
  deriving (Generic, NFDataX, Show, Eq)

decodeInst :: BitVector 8 -> Instruction
decodeInst x = case x of
  $(bitPattern "00aaaaaa") -> Imme
  $(bitPattern "01...aaa") -> Calc aaa
  $(bitPattern "10aaabbb") -> Copy aaa bbb
  $(bitPattern "11...aaa") -> Cond aaa
```

そのテスト．

```hs
prop_decodeInst = H.property $ do
  x <- H.forAll (Gen.integral (Range.linear 0 63))

  let
    x' = x :: BitVector 6
    (a, b) = split x
    z00 = decodeInst (0b00 ++# x')
    z01 = decodeInst (0b01 ++# x')
    z10 = decodeInst (0b10 ++# x')
    z11 = decodeInst (0b11 ++# x')
  z00 H.=== Imme x'
  z01 H.=== Calc b
  z10 H.=== Copy a b
  z11 H.=== Cond b
```

`execute`への追加は以下のような感じ．

```hs
execute (Cond op) state _ = (state { pc = if checkCond op (regs !! 3) then bitCoerce (regs !! 0) else pc + 1 }, Nothing) where CPUState { .. } = state
```

これのテストは以下のような感じです．

```hs
prop_execute_cond = H.property $ do
  x0 <- H.forAll (Gen.integral (Range.linear 0 255))
  x3 <- H.forAll (Gen.integral (Range.linear 0 255))
  op <- H.forAll (Gen.integral (Range.linear 0 7))

  let
    init = CPUState { pc = 5, regs = replace 0 x0 $ replace 3 x3 def }
    (result_state, result_output) = execute (Cond op) init 0
    expected_state = init { pc = if checkCond op x3 then bitCoerce x0 else 6 }
  result_state H.=== expected_state
  result_output H.=== Nothing
```


## プログラムを渡してみる

作ったCPUに実際にプログラムを渡して動作の確認をしてみましょう．

今回動かすプログラムは以下の通りで，6 -> 5 -> 4 ... -> 1と出力に出していきます．

```hs

encodeInst :: Instruction -> BitVector 8
encodeInst (Imme x) = 0b00 ++# x
encodeInst (Calc op) = 0b01000 ++# op
encodeInst (Copy src dst) = 0b10 ++# src ++# dst
encodeInst (Cond op) = 0b11000 ++# op

myProgram = encodeInst <$> myInstructions
myInstructions =
      Imme 4                -- addr=0
  :>  Copy reg0 reg1
  :>  Imme 2
  :>  Copy reg0 reg2
  :>  add
  :>  Copy reg3 output      -- addr=5
  :>  Copy reg3 reg1        -- reg1 = reg3
  :>  Imme 1
  :>  Copy reg0 reg2        -- reg2 = 1
  :>  sub                   -- reg3 = reg1 - 1
  :>  Imme 5
  :>  jmpNOT0               -- if(reg3 != 0) goto addr=5
  :> Imme 0
  :> Imme 0
  :>  Nil
  where
    reg0 = 0b000 :: BitVector 3
    reg1 = 0b001 :: BitVector 3
    reg2 = 0b010 :: BitVector 3
    reg3 = 0b011 :: BitVector 3
    reg4 = 0b100 :: BitVector 3
    reg5 = 0b101 :: BitVector 3
    input = 0b110 :: BitVector 3
    output = 0b110 :: BitVector 3
    or = Calc 0       -- reg3 = reg1 op reg2
    nand = Calc 1
    nor = Calc 2
    and = Calc 3
    add = Calc 4
    sub = Calc 5
    jmpNOT0 = Cond 0b101  -- if reg3 != 0 then pc = reg0 else pc + 1

```

以下のようにすると動作確認できます．

```sh
$ stack run clashi
clashi> import Example.Project
clashi> sampleN @System 50 $ cpu myProgram (pure 0)
[Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Just 0b0000_0110,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Just 0b0000_0101,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Just 0b0000_0100,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Just 0b0000_0011,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Just 0b0000_0010,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Just 0b0000_0001,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing,Nothing]
```

良さそうですね．

## 全体

最終的に全体は以下のようになりました．

```hs
-- @createDomain@ below generates a warning about orphan instances, but we like
-- our code to be warning-free.
{-# OPTIONS_GHC -Wno-orphans #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeApplications #-}


module Example.Project where

import Clash.Prelude

topEntity ::
  Clock System ->
  Reset System ->
  Enable System ->
  Signal System (BitVector 8) ->
  Signal System (Maybe (BitVector 8))
topEntity = exposeClockResetEnable $ cpu myProgram

alu :: (Bits a, Num a) => BitVector 3 -> a -> a -> a
alu $(bitPattern "0ab") x y = if a == 0 then z else complement z
                              where
                                z = x' .|. y'
                                x' = if b == 0 then x else complement x
                                y' = if b == 0 then y else complement y
alu $(bitPattern "10a") x y = x + (if a == 0 then y else negate y)
alu _ x _ = x

data Instruction = Imme (BitVector 6) | Calc (BitVector 3) | Copy (BitVector 3) (BitVector 3) | Cond (BitVector 3)
  deriving (Generic, NFDataX, Show, Eq)

decodeInst :: BitVector 8 -> Instruction
decodeInst x = case x of
  $(bitPattern "00aaaaaa") -> Imme aaaaaa
  $(bitPattern "01...aaa") -> Calc aaa
  $(bitPattern "10aaabbb") -> Copy aaa bbb
  $(bitPattern "11...aaa") -> Cond aaa


checkCond :: BitVector 3 -> BitVector 8 -> Bool
checkCond $(bitPattern "abc") x = if a == 0 then r0 else not r0
  where
    r0 = r1 || r2
    r1 = if b == 0 then False else x < 0
    r2 = if c == 0 then False else x == 0


data CPUState = CPUState { pc :: Unsigned 8, regs :: Vec 6 (BitVector 8) }
  deriving (Generic, NFDataX, Show, Eq, Default)

cpu :: (HiddenClockResetEnable dom, KnownNat n) =>
  Vec n (BitVector 8) ->            -- 命令
  Signal dom (BitVector 8) ->       -- 外部からの入力
  Signal dom (Maybe (BitVector 8))  -- 外部への出力
cpu insts input = mealyB fn def input
  where
    fn s x = if (pc s) < (fromIntegral $ length insts)
      then execute (decodeInst $ asyncRom insts $ pc s) s x
      else (s, Nothing)


execute :: Instruction -> CPUState -> BitVector 8 -> (CPUState, Maybe (BitVector 8))
execute (Calc op) state input = (state { pc = pc + 1, regs = replace 3 (alu op (regs !! 1) (regs !! 2)) regs }, Nothing) where CPUState { .. } = state
execute (Copy src dst) state input = (newState, output)
  where
    CPUState { .. } = state
    srcval = (regs ++ (input :> 0 :> Nil)) !! src
    output = if dst == 0b110 then Just srcval else Nothing
    newState = if dst == 0b110 then state { pc = pc + 1 } else state { pc = pc + 1, regs = replace dst srcval regs }
execute (Imme value) state _ = (state { pc = (pc state) + 1, regs = replace 0 (resize value) $ regs state }, Nothing)
execute (Cond op) state _ = (state { pc = if checkCond op (regs !! 3) then bitCoerce (regs !! 0) else pc + 1 }, Nothing) where CPUState { .. } = state


encodeInst :: Instruction -> BitVector 8
encodeInst (Imme x) = 0b00 ++# x
encodeInst (Calc op) = 0b01000 ++# op
encodeInst (Copy src dst) = 0b10 ++# src ++# dst
encodeInst (Cond op) = 0b11000 ++# op

myProgram = encodeInst <$> myInstructions
myInstructions =
      Imme 4                -- addr=0
  :>  Copy reg0 reg1
  :>  Imme 2
  :>  Copy reg0 reg2
  :>  add
  :>  Copy reg3 output      -- addr=5
  :>  Copy reg3 reg1        -- reg1 = reg3
  :>  Imme 1
  :>  Copy reg0 reg2        -- reg2 = 1
  :>  sub                   -- reg3 = reg1 - 1
  :>  Imme 5
  :>  jmpNOT0               -- if(reg3 != 0) goto addr=5
  :> Imme 0
  :> Imme 0
  :>  Nil
  where
    reg0 = 0b000 :: BitVector 3
    reg1 = 0b001 :: BitVector 3
    reg2 = 0b010 :: BitVector 3
    reg3 = 0b011 :: BitVector 3
    reg4 = 0b100 :: BitVector 3
    reg5 = 0b101 :: BitVector 3
    input = 0b110 :: BitVector 3
    output = 0b110 :: BitVector 3
    or = Calc 0       -- reg3 = reg1 op reg2
    nand = Calc 1
    nor = Calc 2
    and = Calc 3
    add = Calc 4
    sub = Calc 5
    jmpNOT0 = Cond 0b101  -- if reg3 != 0 then pc = reg0 else pc + 1


```

Verilogに変換すると以下のような感じです．

```verilog
/* AUTOMATICALLY GENERATED VERILOG-2001 SOURCE CODE.
** GENERATED BY CLASH 1.8.2. DO NOT MODIFY.
*/
`default_nettype none
`timescale 100fs/100fs
module topEntity
    ( // Inputs
      input wire  eta // clock
    , input wire  eta1 // reset
    , input wire  eta2 // enable
    , input wire [7:0] eta4

      // Outputs
    , output wire [8:0] result
    );
  wire [7:0] c$ds_app_arg;
  wire [7:0] result_1;
  wire [1:0] c$decodeInst_$j_$j1_arg1;
  wire [2:0] c$decodeInst_$j_$j1_$j2_arg1;
  wire [3:0] c$decodeInst_$j_$j1_$j2_$j3_arg1;
  wire [4:0] c$decodeInst_$j_$j1_$j2_$j3_$j4_arg1;
  wire [5:0] result_2;
  wire [7:0] result_3;
  wire [7:0] c$case_alt;
  wire [7:0] c$case_alt_0;
  wire [1:0] c$decodeInst_$j_$j1_arg1_0;
  wire [2:0] result_4;
  wire [1:0] c$decodeInst_$j_$j1_arg1_1;
  wire [2:0] result_5;
  wire [0:0] c$decodeInst_$j_arg1;
  wire [0:0] c$decodeInst_$j_arg1_case_alt;
  wire [7:0] c$decodeInst_$j_arg1_app_arg;
  reg [64:0] result_6;
  wire [7:0] c$app_arg;
  wire  r0;
  wire  result_7;
  wire  c$r0_app_arg;
  wire  c$r0_app_arg_0;
  wire  result_8;
  wire [2:0] op;
  wire [7:0] c$app_arg_0;
  wire [7:0] c$app_arg_1;
  wire [8:0] c$app_arg_2;
  wire [55:0] c$app_arg_3;
  wire  c$case_scrut;
  wire [47:0] c$app_arg_4;
  wire [7:0] srcval;
  wire [2:0] dst;
  wire [2:0] src;
  wire [47:0] c$app_arg_5;
  wire [7:0] result_9;
  wire [7:0] c$case_alt_1;
  wire [7:0] result_10;
  wire [7:0] result_11;
  wire [7:0] c$z_app_arg;
  wire [7:0] c$z_app_arg_0;
  wire  c$z_case_scrut;
  wire [0:0] b;
  wire [7:0] c$app_arg_6;
  wire  c$case_scrut_0;
  wire [2:0] op_0;
  wire [7:0] c$app_arg_7;
  wire [7:0] c$app_arg_8;
  wire [47:0] c$app_arg_9;
  wire [5:0] value;
  wire [7:0] c$app_arg_10;
  wire [64:0] c$ds_case_alt;
  reg [55:0] s = {8'd0,   {8'd0,   8'd0,   8'd0,   8'd0,   8'd0,   8'd0}};
  wire [7:0] c$i_13;
  wire [47:0] c$vec;
  wire [47:0] c$vec_0;
  wire [47:0] c$vec_1;
  wire [63:0] c$vecFlat;
  wire [47:0] c$vec_2;
  wire [47:0] c$vec_3;
  wire [47:0] c$vec_4;
  wire [47:0] c$vec_5;

  assign c$i_13 = s[55:48];

  // asyncRom begin
  wire [7:0] ROM [0:14-1];

  wire [111:0] romflat;
  assign romflat = {8'b00000100,   8'b10000001,   8'b00000010,   8'b10000010,   8'b01000100,
   8'b10011110,   8'b10011001,   8'b00000001,   8'b10000010,   8'b01000101,
   8'b00000101,   8'b11000101,   8'b00000000,   8'b00000000};
  genvar i;
  generate
  for (i=0; i < 14; i=i+1) begin : mk_array
    assign ROM[(14-1)-i] = romflat[i*8+:8];
  end
  endgenerate

  assign c$ds_app_arg = ROM[($unsigned({ {(64-8) {1'b0}},c$i_13}))];
  // asyncRom end

  assign result_1 = (c$decodeInst_$j_arg1_app_arg == 8'b00000000) ? {2'b00,result_2} : result_3;

  assign c$decodeInst_$j_$j1_arg1 = ((c$ds_app_arg[(64'sd1)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_arg1_case_alt}) : ({1'b0,c$decodeInst_$j_arg1_case_alt});

  assign c$decodeInst_$j_$j1_$j2_arg1 = ((c$ds_app_arg[(64'sd2)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_arg1}) : ({1'b0,c$decodeInst_$j_$j1_arg1});

  assign c$decodeInst_$j_$j1_$j2_$j3_arg1 = ((c$ds_app_arg[(64'sd3)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_$j2_arg1}) : ({1'b0,c$decodeInst_$j_$j1_$j2_arg1});

  assign c$decodeInst_$j_$j1_$j2_$j3_$j4_arg1 = ((c$ds_app_arg[(64'sd4)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_$j2_$j3_arg1}) : ({1'b0,c$decodeInst_$j_$j1_$j2_$j3_arg1});

  assign result_2 = ((c$ds_app_arg[(64'sd5)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_$j2_$j3_$j4_arg1}) : ({1'b0,c$decodeInst_$j_$j1_$j2_$j3_$j4_arg1});

  assign result_3 = (c$decodeInst_$j_arg1_app_arg == 8'b01000000) ? {2'b01,result_5,3'bxxx} : c$case_alt;

  assign c$case_alt = (c$decodeInst_$j_arg1_app_arg == 8'b10000000) ? {2'b10,result_4,result_5} : c$case_alt_0;

  assign c$case_alt_0 = (c$decodeInst_$j_arg1_app_arg == 8'b11000000) ? {2'b11,result_5,3'bxxx} : ({8 {1'bx}});

  assign c$decodeInst_$j_$j1_arg1_0 = ((c$ds_app_arg[(64'sd4)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_arg1}) : ({1'b0,c$decodeInst_$j_arg1});

  assign result_4 = ((c$ds_app_arg[(64'sd5)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_arg1_0}) : ({1'b0,c$decodeInst_$j_$j1_arg1_0});

  assign c$decodeInst_$j_$j1_arg1_1 = ((c$ds_app_arg[(64'sd1)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_arg1_case_alt}) : ({1'b0,c$decodeInst_$j_arg1_case_alt});

  assign result_5 = ((c$ds_app_arg[(64'sd2)]) == (1'b1)) ? ({1'b1,c$decodeInst_$j_$j1_arg1_1}) : ({1'b0,c$decodeInst_$j_$j1_arg1_1});

  assign c$decodeInst_$j_arg1 = ((c$ds_app_arg[(64'sd3)]) == (1'b1)) ? 1'b1 : 1'b0;

  assign c$decodeInst_$j_arg1_case_alt = ((c$ds_app_arg[(64'sd0)]) == (1'b1)) ? 1'b1 : 1'b0;

  assign c$decodeInst_$j_arg1_app_arg = 8'b11000000 & c$ds_app_arg;

  always @(*) begin
    case(result_1[7:6])
      2'b00 : result_6 = { {c$app_arg_10,
                           c$app_arg_9},   {1'b0,8'bxxxxxxxx}};
      2'b01 : result_6 = { {c$app_arg_10,
                           c$app_arg_5},   {1'b0,8'bxxxxxxxx}};
      2'b10 : result_6 = {c$app_arg_3,   c$app_arg_2};
      default : result_6 = { {c$app_arg,   s[47:0]},
                            {1'b0,8'bxxxxxxxx}};
    endcase
  end

  assign c$app_arg = result_8 ? ((c$app_arg_0)) : c$app_arg_10;

  assign r0 = c$r0_app_arg_0 | c$r0_app_arg;

  assign result_7 = ((op[(64'sd2)]) == (1'b1)) ? (~ r0) : r0;

  assign c$r0_app_arg = ((op[(64'sd0)]) == (1'b1)) ? (c$app_arg_1 == 8'b00000000) : 1'b0;

  assign c$r0_app_arg_0 = ((op[(64'sd1)]) == (1'b1)) ? (c$app_arg_1 < 8'b00000000) : 1'b0;

  assign result_8 = ((3'b000 & op) == 3'b000) ? result_7 : ({1 {1'bx}});

  assign op = result_1[5:3];

  assign c$vec = s[47:0];

  // index lit begin
  assign c$app_arg_0 = c$vec[48-1-0*8 -: 8];
  // index lit end

  assign c$vec_0 = s[47:0];

  // index lit begin
  assign c$app_arg_1 = c$vec_0[48-1-3*8 -: 8];
  // index lit end

  assign c$app_arg_2 = c$case_scrut ? {1'b1,srcval} : {1'b0,8'bxxxxxxxx};

  assign c$app_arg_3 = c$case_scrut ? {c$app_arg_10,
                                       s[47:0]} : {c$app_arg_10,   c$app_arg_4};

  assign c$case_scrut = dst == 3'b110;

  assign c$vec_1 = s[47:0];

  // vector replace begin
  genvar i_0;
  generate
  for (i_0=0;i_0<6;i_0=i_0+1) begin : vector_replace
    assign c$app_arg_4[(5-i_0)*8+:8] = ($unsigned({ {(64-3) {1'b0}},dst})) == i_0 ? srcval : c$vec_1[(5-i_0)*8+:8];
  end
  endgenerate
  // vector replace end

  assign c$vecFlat = ({s[47:0],{eta4,   8'b00000000}});

  // index begin
  wire [7:0] vecArray [0:8-1];
  genvar i_1;
  generate
  for (i_1=0; i_1 < 8; i_1=i_1+1) begin : mk_array_0
    assign vecArray[(8-1)-i_1] = c$vecFlat[i_1*8+:8];
  end
  endgenerate
  assign srcval = vecArray[($unsigned({ {(64-3) {1'b0}},src}))];
  // index end

  assign dst = result_1[2:0];

  assign src = result_1[5:3];

  assign c$vec_2 = s[47:0];

  // vector replace begin
  genvar i_2;
  generate
  for (i_2=0;i_2<6;i_2=i_2+1) begin : vector_replace_0
    assign c$app_arg_5[(5-i_2)*8+:8] = (64'sd3) == i_2 ? result_9 : c$vec_2[(5-i_2)*8+:8];
  end
  endgenerate
  // vector replace end

  assign result_9 = ((3'b100 & op_0) == 3'b000) ? result_10 : c$case_alt_1;

  assign c$case_alt_1 = ((3'b110 & op_0) == 3'b100) ? (c$app_arg_8 + c$app_arg_6) : c$app_arg_8;

  assign result_10 = ((op_0[(64'sd1)]) == (1'b1)) ? (~ result_11) : result_11;

  assign result_11 = c$z_app_arg_0 | c$z_app_arg;

  assign c$z_app_arg = c$z_case_scrut ? c$app_arg_7 : (~ c$app_arg_7);

  assign c$z_app_arg_0 = c$z_case_scrut ? c$app_arg_8 : (~ c$app_arg_8);

  assign c$z_case_scrut = b == 1'b0;

  assign b = c$case_scrut_0 ? 1'b1 : 1'b0;

  assign c$app_arg_6 = c$case_scrut_0 ? (-c$app_arg_7) : c$app_arg_7;

  assign c$case_scrut_0 = (op_0[(64'sd0)]) == (1'b1);

  assign op_0 = result_1[5:3];

  assign c$vec_3 = s[47:0];

  // index lit begin
  assign c$app_arg_7 = c$vec_3[48-1-2*8 -: 8];
  // index lit end

  assign c$vec_4 = s[47:0];

  // index lit begin
  assign c$app_arg_8 = c$vec_4[48-1-1*8 -: 8];
  // index lit end

  assign c$vec_5 = s[47:0];

  // vector replace begin
  genvar i_3;
  generate
  for (i_3=0;i_3<6;i_3=i_3+1) begin : vector_replace_1
    assign c$app_arg_9[(5-i_3)*8+:8] = (64'sd0) == i_3 ? ({2'b00,value}) : c$vec_5[(5-i_3)*8+:8];
  end
  endgenerate
  // vector replace end

  assign value = result_1[5:0];

  assign c$app_arg_10 = s[55:48] + 8'd1;

  assign c$ds_case_alt = (s[55:48] < 8'd14) ? result_6 : {s,
                                                          {1'b0,8'bxxxxxxxx}};

  assign result = c$ds_case_alt[8:0];

  // register begin
  always @(posedge eta or  posedge  eta1) begin : s_register
    if ( eta1) begin
      s <= {8'd0,   {8'd0,   8'd0,   8'd0,   8'd0,   8'd0,   8'd0}};
    end else if (eta2) begin
      s <= c$ds_case_alt[64:9];
    end
  end
  // register end


endmodule
```

正直よくわからないのでふーんって感じですね．
