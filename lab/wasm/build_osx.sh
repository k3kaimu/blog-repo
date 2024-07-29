export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
export LDFLAGS="-L/opt/homebrew/opt/llvm/lib"
export CPPFLAGS="-I/opt/homebrew/opt/llvm/include"
clang -DNDEBUG -O2 --target=wasm32 -nostdlib -c -o walloc.o walloc.c
ldc2 --O2 -mtriple=wasm32-unknown-unknown-wasm -betterC -L-allow-undefined -mattr=+simd128 --ffast-math math.d walloc.o