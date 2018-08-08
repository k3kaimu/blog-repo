---
layout: post
title:  "再帰的データ構造におけるデストラクタの問題"
categories: blog
tags:  blog
author: けーさん
---

Rust入門３日目のけーさんです．

Rustを使ってスタックを実装したいとき，
再帰的データ構造を意識すれば，次のようにスタックを実装できると思います．


```rust
struct Stack<T> {
    head: Option<Box<Node<T>>>
}

struct Node<T> {
    elem: T,
    next: Option<Box<Node<T>>>
}

impl<T> Stack<T> {
    pub fn new() -> Self {
        Stack { head: None }
    }

    pub fn pop(&mut self) -> Option<T> {
        // ...省略
    }

    pub fn push(&mut self, e: T) {
        // ...省略
    }
}
```

この`Stack<T>`はもちろんちゃんと次のテストが通ります．
（そのようにpush, popを実装します）

```rust
let mut stack = Stack::new();

assert_eq!(stack.pop(), None);

stack.push(123);
assert_eq!(stack.pop(), Some(123));

stack.push(1);
stack.push(2);
stack.push(3);
assert_eq!(stack.pop(), Some(3));
assert_eq!(stack.pop(), Some(2));
assert_eq!(stack.pop(), Some(1));
assert_eq!(stack.pop(), None);
```

しかし，次のコードは`fatal runtime error: stack overflow`でプログラムが異常終了してしまいます．

```rust
let mut stack = Stack::new();

for i in 0..20_000 {
    stack.push(i)
}
```

たったこれだけのコードで，この`Stack`の何がいけないのでしょうか？
結論からいえば，タイトルにもある通りデストラクタが原因です．
この場合は`stack`のデストラクタの呼び出しを皮切りに，再帰的に`Node`のデストラクタが呼び出されることでスタックオーバーフローになります．

もう少し噛み砕くと，まず`stack`のデストラクタが行われますが，`stack`のデストラクタの内部では`stack.head`のデストラクタが行われます．
同様に`stack.head`のデストラクタでは`stack.head.elem`と`stack.head.next`がデストラクタが実行されますが，`stack.head.next.next`も．．．というように再帰的にデストラクタが実行されるのです．

この問題は`Stack`に数個要素を追加するだけでは発生しませんが，しかし2万個程度要素があるだけでデストラクタはスタック領域を食いつぶしてしまうのです．

僕がこの問題に直面したとき，なぜスタックオーバーフローとなっているのか全く理解が出来ませんでした．

この問題に気づきにくい原因は２つあると思います．

+ この問題は再帰的なデータ構造に特有な問題
+ デストラクタがコードに表れておらず，動作が読み取りにくい

特に2つ目が主な原因だと思います．
C++やD言語でもそうですが，構造体のデストラクタはコンパイラが自動的に生成してくれるので，プログラマがわざわざ自分で書く必要がない場合が多いと思います．

しかし，再帰的なデータ構造ではこのデフォルトのデストラクタが悪さをしてプログラムをスタックオーバーフローへと導きます．

この問題はRustのみの問題ではなく，C++でも同様に起こります．

```cpp
template <typename T>
struct StackNode {
    StackNode(T e, std::unique_ptr<StackNode<T>> && n)
    : elem(e), next(std::move(n)) {}

    T elem;
    std::unique_ptr<StackNode<T>> next;
};

template <typename T>
struct Stack {
    std::unique_ptr<StackNode<T>> head;

    void push(T elem) { /* ...*/ }
};

int main() {
    Stack<int> stack{};
    for(int i = 0; i < 1000000; ++i) {
        stack.push(i);
    }
}
```

## 対策

自分でちゃんとデストラクタ，つまりRustでは`Drop`トレイトの`drop`を実装すれば問題は起こりません．

```rust
impl<T> Drop for List<T> {
    fn drop(&mut self) {
        let mut node = mem::replace(&mut self.head, None);

        while let Some(x) = node {
            node = x.next;
        }
    }
}
```

C++でも同じです．

```cpp
template <typename T>
Stack<T>::~Stack()
{
    while(head) {
        auto h = std::move(head);
        head = std::move(h->next);
    }
}
```
