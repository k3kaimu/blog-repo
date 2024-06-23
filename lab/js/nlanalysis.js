function fact(n) {
    let dst = 1;
    for(let i = 2; i < n + 1; ++i)
        dst *= i;

    return dst;
}


function binom(x, k) {
    let num = 1;
    let den = 1;
    for(let i = 0; i < k; ++i) {
        num *= x - i;
        den *= k - i;
    }

    return num / den;
}


function laguerre(x, n, a) {
    let sum = 0;
    for(let i = 0; i < n + 1; ++i)
        sum += ((-1) ** i) * binom(n + a, n - i) * (x ** i) / fact(i);

    return sum;
}


function laguerre_norm(p, x) {
    let m = (p-1)/2;
    let normCoef = 1/math.sqrt(m + 1.0);
    return ((-1) ** m) * normCoef * x * laguerre(math.abs(x)**2, m, 1);
}


/**
S_x(f)を[-1/2, 1/2]で1，それ以外で0であるスペクトルとしたとき，
S_x(f)をn次畳込みしたスペクトルを計算します
*/
function nTimesConvRectSpectrum(f, n) {
    function powWithMax0(x, p)
    {
        if(x > 0)
            return x**p;
        else
            return 0;
    }

    var dst = 0;
    for(var k = 0; k < n+1; ++k)
        dst += (-1.0)**k * binom(n, k) * powWithMax0(Math.abs(f) - k + n/2.0, n-1);

    return dst / fact(n-1);
}


// Theoretical symbol error rate of M-QAM on AWGN channel
function qamSER(snr, M)
{
    let a = 1 - 1/Math.sqrt(M);
    let b = 3.0 / (2 * (M - 1));
    let p = a * erfc(Math.sqrt(b * snr));
    return 1 - (1 - p)**2;
}
