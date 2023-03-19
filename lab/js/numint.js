class NumInt {
    constructor(xs, ws)
    {
        this.xs = xs;
        this.ws = ws;
    }


    integrate(fn) {
        let s = 0;
        const N = this.xs.length;
        for(let i = 0; i < N; ++i)
            s = math.add(s, math.multiply(fn(this.xs[i]), this.ws[i]));

        return s;
    }
}



function makeDEInt(xa, xb, isExpDecay, trapN = 100, ta = -5, tb = 5)
{
    xa = Number(xa);
    xb = Number(xb);
    isExpDecay = !!isExpDecay;
    trapN = Number(trapN)
    ta = Number(ta);
    tb = Number(tb);

    function _makeParamsImpl(fn)
    {
        let xs = [];
        let ws = [];
        const h = (tb - ta) / (trapN - 1);
        for(let i = 0; i < trapN; ++i) {
            const xWt = fn(i * h + ta);
            xs.push(xWt[0]);
            ws.push(xWt[1] * h);
        }

        return new NumInt(xs, ws);
    }


    if(xa > xb) {
        let invInt = makeDEInt(xb, xa, isExpDecay, trapN, ta, tb);
        let newws = invInt.ws.map(x => -x);
        return new NumInt(invInt.xs, newws);
    } else if(xa == -Infinity && xb != Infinity) {
        let tmpInt = makeDEInt(-xb, Infinity, isExpDecay, trapN, ta, tb);
        let newxs = tmpInt.xs.map(x => -x);
        return new NumInt(newxs, tmpInt.ws);
    }


    if(xa == -Infinity && xb == Infinity){
        assert(!isExpDecay);

        return _makeParamsImpl(function(t){
            let
                sinht = Math.sinh(t),
                x = Math.sinh(Math.PI / 2 * sinht),
                dx = Math.cosh(Math.PI / 2 * sinht) * Math.PI / 2 * Math.cosh(t);

            return [x, dx];
        });
    }else if(xb == Infinity) {
        return _makeParamsImpl(function(t){
            if(!isExpDecay){
                let x = exp(Math.PI / 2 * Math.sinh(t)),
                        dx = x * Math.PI / 2 * Math.cosh(t);

                return [x + xa, dx];
            }else{
                let expmt = Math.exp(-t),
                        x = Math.exp(t - expmt),
                        dx = (1 + expmt) * x;

                return [x + xa, dx]; 
            }
        });
    }else{
        if(xa == 0 || xb == 0){
            return _makeParamsImpl(function(t){
                let
                    cosht = Math.cosh(t),
                    sinht = Math.sinh(t),
                    epsinht = Math.exp(Math.PI * sinht),
                    x = (xa + xb*epsinht)/(1 + epsinht),
                    cosh2 = Math.cosh(Math.PI / 2 * sinht)**2,
                    dx = Math.PI / 2 * cosht / cosh2;

                return [x, dx * (xb - xa)/2];
            });
        }else{
            let diff2 = (xb - xa)/2;
            let avg2 = (xb + xa)/2;

            return _makeParamsImpl(function(t){
                let
                    cosht = Math.cosh(t),
                    sinht = Math.sinh(t),
                    x = Math.tanh(Math.PI / 2 * sinht) * diff2 + avg2,
                    cosh2 = Math.cosh(Math.PI / 2 * sinht)**2,
                    dx = Math.PI / 2 * cosht / cosh2;

                return [x, dx * diff2];
            });
        }
    }
}


function withWeight(numint, fn)
{
    let ws = [];
    let N = numint.xs.length;
    for(let i = 0; i < N; ++i) {
        ws.push(math.multiply(fn(numint.xs[i]), numint.ws[i]));
    }

    return new NumInt(numint.xs, ws);
}
