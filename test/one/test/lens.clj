(ns one.test.lens
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.lens :as lens])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defspec current
  #(lens/set data/current % test/editor)
  [^keyword key]
  (is (= (lens/get data/current %) key)))

(defspec buffer
  #(lens/set data/buffer % test/editor)
  [^test/buffer buffer]
  (is (= (lens/get data/buffer %) buffer)))

(defspec cursor
  #(lens/set data/cursor % test/editor)
  [^test/cursor cursor]
  (is (= (lens/get data/cursor %) cursor)))
