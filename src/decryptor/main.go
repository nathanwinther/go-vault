package main

import (
    "crypto/aes"
    "crypto/cipher"
    "encoding/hex"
    "fmt"
    "io/ioutil"
    "os"
    "path"
    "strings"
)

func main() {
    if len(os.Args) == 3 {
        filename := os.Args[1]
        passphrase := os.Args[2]

        b, err := decrypt(filename, passphrase)
        if err != nil {
            panic(err)
        }
        fmt.Printf("%s\n", b)
    } else {
        fmt.Printf("%s filename passphrase\n", path.Base(os.Args[0]))
    }
}

func decrypt(filename string, passphrase string) ([]byte, error) {
    block, err := aes.NewCipher([]byte(padRight(passphrase, 32)))
    if err != nil {
        return nil, err
    }

    b, err := ioutil.ReadFile(filename)
    if err != nil {
        return nil, err
    }

    s := strings.TrimSpace(string(b))

    b, err = hex.DecodeString(s)
    if err != nil {
        return nil, err
    }

    bs := aes.BlockSize
    iv := b[:bs]
    b = b[bs:]

    mode := cipher.NewCBCDecrypter(block, iv)
    mode.CryptBlocks(b, b)

    b = trim(b)

    return b, nil
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

func trim(b []byte) []byte {
    for i, c := range(b) {
        if c == 3 || c == 0 {
            return b[:i]
        }
    }
    return b
}

