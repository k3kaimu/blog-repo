// Downloaded from https://gist.github.com/bellbind/7569c6b968ee82bc8393222c784ef2fe
// erf(x): error function (see: https://en.wikipedia.org/wiki/Error_function)
// by https://github.com/jeremybarnes/cephes/blob/master/cprob/ndtr.c

const P = [
    2.46196981473530512524E-10,
    5.64189564831068821977E-1,
    7.46321056442269912687E0,
    4.86371970985681366614E1,
    1.96520832956077098242E2,
    5.26445194995477358631E2,
    9.34528527171957607540E2,
    1.02755188689515710272E3,
    5.57535335369399327526E2,
];
const Q = [
    1.32281951154744992508E1,
    8.67072140885989742329E1,
    3.54937778887819891062E2,
    9.75708501743205489753E2,
    1.82390916687909736289E3,
    2.24633760818710981792E3,
    1.65666309194161350182E3,
    5.57535340817727675546E2,
];
const R = [
    5.64189583547755073984E-1,
    1.27536670759978104416E0,
    5.01905042251180477414E0,
    6.16021097993053585195E0,
    7.40974269950448939160E0,
    2.97886665372100240670E0,
];
const S = [
    2.26052863220117276590E0,
    9.39603524938001434673E0,
    1.20489539808096656605E1,
    1.70814450747565897222E1,
    9.60896809063285878198E0,
    3.36907645100081516050E0,
];
const T = [
    9.60497373987051638749E0,
    9.00260197203842689217E1,
    2.23200534594684319226E3,
    7.00332514112805075473E3,
    5.55923013010394962768E4,
];
const U = [
    3.35617141647503099647E1,
    5.21357949780152679795E2,
    4.59432382970980127987E3,
    2.26290000613890934246E4,
    4.92673942608635921086E4,
];
function polevl(x, c) {
    return c.reduce((r, c) => r * x + c, 0);
}
function p1evl(x, c) {
    return c.reduce((r, c) => r * x + c, 1);
}

function erf(x) {
    if (Math.abs(x) > 1) return 1 - erfc(x);
    const z = x * x;
    return x * polevl(z, T) / p1evl(z, U);
}
// erfc(x) = 1 - erf(x)
const MAXLOG = Math.log(Number.MAX_VALUE);
function erfc(x0) {
    const x = Math.abs(x0);
    if (x < 1) return 1 - erf(x);
    const z = -x0 * x0;
    if (z < -MAXLOG) return x0 < 0 ? 2 : 0;
    const [p, q] = x < 8 ? [P, Q] : [R, S];
    const y = Math.exp(z) * polevl(x, p) / p1evl(x, q);
    return x0 < 0 ? 2 - y : y;
}
// erfce(x) = exp(x**2) * erfc(x)
function erfce(x) {
    console.assert(x > 1);
    const [p, q] = x < 8 ? [P, Q] : [R, S];
    return polevl(x, p) / p1evl(x, q);
}
// ndtr(a) = (1 + erf(a/sqrt(s))) / 2
const SQRTH = 2 ** 0.5 / 2;
function ndtr(a) {
    const x = a * SQRTH;
    const z = Math.abs(x);
    if (z < 1) return (1 + erf(x)) / 2;
    const y = erfc(z) / 2;
    return x > 0 ? 1 - y : y;
}

// // check
// const x = Array.from(Array(60), (_, i) => -3 + i * 0.1);
// x.forEach(x => console.log(`erf(${x.toFixed(1).padStart(4)}) = ${erf(x)}`));

// console.log("-".repeat(80));
// const y = x.map(x => erf(x));
// for (let i = 0; i < 20; i++) {
//     const max = 1 - 0.1 * i;
//     const min = max - 0.1;
//     const plot = y.map(y => min < y && y <= max ? "*" : " ").join("");
//     const r = `${max.toFixed(1).padStart(4)} ~ ${min.toFixed(1).padStart(4)}`;
//     console.log(`${r}: ${plot}`);
// }
// console.log("-".repeat(80));
