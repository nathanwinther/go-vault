package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "fmt"
    "io"
    "io/ioutil"
    "os"
    "path"
)

func main() {
    if len(os.Args) == 3 {
        filename := os.Args[1]
        passphrase := os.Args[2]

        b, err := encrypt(filename, passphrase)
        if err != nil {
            panic(err)
        }

        fmt.Printf("%x\n", b)
    } else {
        fmt.Printf("%s filename passphrase\n", path.Base(os.Args[0]))
    }
}

func encrypt(filename string, passphrase string) ([]byte, error) {
    block, err := aes.NewCipher([]byte(padRight(passphrase, 32)))
    if err != nil {
        return nil, err
    }

    b, err := ioutil.ReadFile(filename)
    if err != nil {
        return nil, err
    }

    bs := aes.BlockSize
    if len(b) % bs > 0 {
        _b := make([]byte, len(b) + (bs - (len(b) % bs)))
        copy(_b, b)
        b = _b
    }

    c := make([]byte, len(b) + bs)

    iv := c[:bs]
    _, err = io.ReadFull(rand.Reader, iv)
    if err != nil {
        return nil, err
    }

    mode := cipher.NewCBCEncrypter(block, iv)
    mode.CryptBlocks(c[bs:], b)

    return c, nil
}

func padRight(s string, size int) []byte {
    if len(s) >= size {
        return []byte(s)
    }

    v := make([]byte, size)
    for i, _ := range v {
        copy(v[i:], []byte(fmt.Sprintf("%d", (i + 1) % 10)))
    }
    
    copy(v, []byte(s))

    return v
}
