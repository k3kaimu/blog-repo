---
layout: post
title:  "dubのcopyFiles"
date:   2015-3-10 20:00:00
categories: dlang
tags: dtips
---

* content
{:toc}

dubでは、`dub.json`に記述した`"copyFiles"`というプロパティにファイル名を設定することで、
ビルド時にファイルをコピーするように設定できます。
これはWindowsでDLLを実行ファイルと同じディレクトリに置くために存在します。

今回はこのcopyFilesを使い倒します。


<!--more-->


## ファイルがコピーされるタイミング

`"copyFiles"`に設定したファイルは、プロジェクトのビルドが完全に終わってからコピーされます。
そのため、プロジェクトのビルド前にファイルをコピーしてほしい場合には、`"preGenerateCommands"`や`"preBuildCommands"`にコピーするコマンドを書くしかありません。

~~~~~~~~~~~~~~~~js
"preGenerateCommands": ["cp fromFile toFile"]
~~~~~~~~~~~~~~~~~~

もし、あなたが作っているプロジェクトがライブラリとして、他のプロジェクトから使用されるのであればこの方法は使用できません。
なぜなら、`"preGenerateCommands"`や`"preBuildCommands"`は、あなたのライブラリのディレクトリで実行されるわけではなく、そのライブラリを使用するプロジェクトのディレクトリで実行されるためです。
そこで、あなたのライブラリの`dub.json`の"configurations"を次のように編集します。

~~~~~~~~~~~~~~~js
"configurations":[
  {
    "name": "library",
  },

  {
    "name": "preBuildCopyCommand",
    "copyFiles": ["Build前にコピーしたいファイル"],
  }
]
~~~~~~~~~~~~~~~~~

そして、このライブラリ使用者は次のような`configurations`を`dub.json`に書くように心がけます。

~~~~~~~~~~~~~~~js
"configurations": [
  {
    "name": "application",
    "targetType": "executable",
    "preGenerateCommands":[
      "dub generate --config=preBuildCopyCommand visuald",
    ],
  },

  {
    "name": "preBuildCopyCommand",
    "subConfigurations": {
      "myLibrary": "preBuildCopyCommand"
    }
  },
],
~~~~~~~~~~~~~~~~~

このconfigurationsは、まず`"application"`の`"preGenerateCommands"`が実行されます。
つまり、`dub generate --config=preBuildCopyCommand visuald`が実行されるため、ライブラリmyLibraryの`"preBuildCopyCommand"`の`copyFiles`がビルド前に実行されるのです。
このとき、VisualD用の`.sln`ファイル等ができてしまうため、邪魔に思った場合は`"application"`の`"postBuildCommands"`や`"postGenerateCommands"`でそれらのファイルを削除してしまいましょう。


## ディレクトリをコピーする

ディレクトリをコピーするには、事前にディレクトリをzip等で圧縮しておき、先ほど述べたBuild前コピーのテクニックで先にコピーしておき、`unzip`してしまいましょう。

~~~~~~~~~~~~~~~js
"configurations":[
  {
    "name": "library",
  },

  {
    "name": "preBuildCopyCommand",
    "copyFiles": ["zipFile.zip"],
  }

  {
    "name": "preBuildPostCopyCommand",
    "preGenerateCommands": ["unzip zipFile.zip"]
  }
]
~~~~~~~~~~~~~~~~~

~~~~~~~~~~~~~~~js
"configurations": [
  {
    "name": "application",
    "targetType": "executable",
    "preGenerateCommands":[
      "dub generate --config=preBuildCopyCommand visuald",
      "dub generate --config=preBuildPostCopyCommand visuald"
    ],
  },

  {
    "name": "preBuildCopyCommand",
    "subConfigurations": {
      "myLibrary": "preBuildCopyCommand"
    }
  },

  {
    "name": "preBuildPostCopyCommand",
    "subConfigurations": {
      "myLibrary": "preBuildCopyCommand"
    }
  }
],
~~~~~~~~~~~~~~~~~


## 他の言語のソースをビルドした結果のオブジェクトファイルをリンクする

Build前コピーのテクニックで先にそのコードをコピーしておき、その直後にその言語でビルドしオブジェクトファイルを生成します。

~~~~~~~~~~~~~~~js
"configurations":[
  {
    "name": "library",
  },

  {
    "name": "preBuildCopyCommand",
    "copyFiles": ["c/src/src.cpp"],
  }

  {
    "name": "preBuildPostCopyCommand",
    "preGenerateCommands": ["g++ -c src.cpp"]
  }
]
~~~~~~~~~~~~~~~~~

~~~~~~~~~~~~~~~js
"configurations": [
  {
    "name": "application",
    "targetType": "executable",
    "preGenerateCommands":[
      "dub generate --config=preBuildCopyCommand visuald",
      "dub generate --config=preBuildPostCopyCommand visuald"
    ],
  },

  {
    "name": "preBuildCopyCommand",
    "subConfigurations": {
      "myLibrary": "preBuildCopyCommand"
    }
  },

  {
    "name": "preBuildPostCopyCommand",
    "subConfigurations": {
      "myLibrary": "preBuildPostCopyCommand"
    }
  }
],
~~~~~~~~~~~~~~~~~


## さいごに


そもそも、`copyFiles`に書いたファイルのコピーが`"preGenerateCommands"`よりも先に実行されていれば、このような労力はいらなかったのです。

この方法はかなりのバッドノウハウですが、使えるとかなり融通がきくため知っていると良いと思います。
使うかどうかは別として。
