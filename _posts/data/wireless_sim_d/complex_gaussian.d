module complex_gaussian;

import std.complex;
import std.math;
import std.random;

/// 平均0, 電力1の複素ガウス分布する確率変数の乱数
Complex!F complexGaussian01(F, UniformRNG)(ref UniformRNG rnd)
{
    F x = uniform01!F(rnd);
    F y = uniform01!F(rnd);

    return cast(Complex!F)(sqrt(-log(x)) * std.complex.expi(2 * PI * y));
}

unittest
{
    import std;
    immutable N = 1024 * 1024;
    auto rnd = Xorshift(0);
    auto rcoef = 
        generate!(() => complexGaussian01!double(rnd)).take(N)
        .map!("a.re * a.re", "a.re * a.im", "a.im * a.im")
        .fold!("a + b[0]", "a + b[1]", "a + b[2]")(0.0, 0.0, 0.0)
        .tupleof.only.map!(a => a / N);

    assert(rcoef[0].approxEqual(0.5, 0, 1E-2)); // 実部の電力
    assert(rcoef[1].approxEqual(0.0, 0, 1E-2)); // 実部と虚部の相関
    assert(rcoef[2].approxEqual(0.5, 0, 1E-2)); // 虚部の電力
}