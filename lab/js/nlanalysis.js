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
    let m = p/2;
    let normCoef = 1/math.sqrt(m + 1.0);
    return ((-1) ** m) * normCoef * x * laguerre(math.abs(x)**2, m, 1);
}
