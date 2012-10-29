(ns one.test.lens
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.lens :as lens])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defspec current
  (fn [editor key] (lens/set data/current key editor))
  [^test/editor editor ^keyword key]
  (is (= (lens/get data/current %) key)))

(defspec buffer
  (fn [editor buffer] (lens/set data/buffer buffer editor))
  [^test/editor editor ^test/buffer buffer]
  (is (= (lens/get data/buffer %) buffer)))

(defspec cursor
  (fn [editor cursor] (lens/set data/cursor cursor editor))
  [^test/editor editor ^test/cursor cursor]
  (is (= (lens/get data/cursor %) cursor)))
