// ldc2 --O2 -mtriple=wasm32-unknown-unknown-wasm -betterC -L-allow-undefined --ffast-math math.d

// import ldc2.attributes;
extern(C):
void _start() {}

// from walloc.c
void* malloc(size_t);
void free(const(void)*);

// import walloc;

// pragma(LDC_intrinsic, "llvm.powi.f64.i32")
double powi_wasm(double a, int b);

pragma(LDC_intrinsic, "llvm.sqrt.f64")
double sqrt_wasm(double a);

pragma(LDC_intrinsic, "llvm.fabs.f64")
double abs_wasm(double a);

// pragma(LDC_intrinsic, "llvm.wasm.memory.size.i32")
// int __builtin_wasm_memory_size();

// pragma(LDC_intrinsic, "llvm.wasm.memory.grow.i32")
// void* __builtin_wasm_memory_grow(int, int);

double fact(int n)
{
    long dst = 1;
    foreach(i; 2 .. n + 1)
        dst *= i;

    return dst;
}


double binom(double x, int k)
{
    double num = 1;
    double den = 1;
    foreach(i; 0 .. k) {
        num *= x - i;
        den *= k - i;
    }

    return num / den;
}


double laguerre(double x, int n, double a)
{
    double sum = 0;
    double sign = 1;
    foreach(i; 0 .. n + 1) {
        sum += sign * binom(n + a, n - i) * (powi_wasm(x, i)) / fact(i);
        sign *= -1;
    }

    return sum;
}


double laguerre_norm(int p, double x)
{
    int m = (p - 1)/2;
    double normCoef = 1 / sqrt_wasm(m + 1.0);
    double ax = abs_wasm(x);
    return powi_wasm(-1, m) * normCoef * x * laguerre(ax*ax, m, 1);
}


double* preComputeLaguerreNormBasisWithWeight(int* plist, size_t plistsize, double* xlist, size_t xlistsize, double* weights)
{
    double* dst = cast(double*) malloc(plistsize * xlistsize * double.sizeof);
    foreach(ip; 0 .. plistsize) {
        foreach(ix; 0 .. xlistsize) {
            immutable p = plist[ip];
            immutable x = xlist[ix];
            dst[ip * xlistsize + ix] = laguerre_norm(p, x) * weights[ix];
        }
    }

    return dst;
}


double* computePNLlist(double* prebasis, size_t plistsize, size_t xlistsize, double* func_re, double* func_im)
{
    double* dst = cast(double*) malloc(plistsize * double.sizeof);
    foreach(ip; 0 .. plistsize) {
        double sum_re = 0, sum_im = 0;
        foreach(ix; 0 .. xlistsize) {
            sum_re += func_re[ix] * prebasis[ip*xlistsize + ix];
            sum_im += func_im[ix] * prebasis[ip*xlistsize + ix];
        }

        dst[ip] = sum_re*sum_re + sum_im*sum_im;
    }

    return dst;
}


double computeTotalPower(double* func_re, double* func_im, double* weights, size_t xlistsize)
{
    double sum = 0;
    foreach(i; 0 .. xlistsize)
        sum += (func_re[i]*func_re[i] + func_im[i]*func_im[i]) * weights[i];

    return sum;
}


void* walloc(size_t n)
{
    return malloc(n);
}


void wfree(void* p)
{
    free(p);
}
