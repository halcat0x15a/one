(ns one.test.lens
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.lens :as lens])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defmacro defspec-lens [name lens type]
  `(defspec ~name
     #(lens/set ~lens % test/editor)
     [{:tag ~type} value#]
     (is (= (lens/get ~lens %) value#))))

(defspec current
  #(lens/set data/current % test/editor)
  [^keyword key]
  (is (= (lens/get data/current %) key)))

(defspec buffer
  #(lens/set data/buffer % test/editor)
  [^test/buffer buffer]
  (is (= (lens/get data/buffer %) buffer)))
