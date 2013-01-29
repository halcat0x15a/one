(ns felis.canvas.color)

(def black 0x000000)

(def white 0xFFFFFF)

(def invert (partial bit-xor 0xFFFFFF))
