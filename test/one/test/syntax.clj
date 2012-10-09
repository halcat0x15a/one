(ns one.test.syntax
  (:require [one.test :as test]
            [one.core.parser :as parser]
            [one.core.syntax :as syntax])
  (:use [clojure.test :only [deftest testing are]]))

(deftest syntax
  (testing "parse clojure"
    (are [x y] (= x y)
         (count (parser/parse syntax/clojure "(def a 100)")) 7
         (count (parser/parse syntax/clojure "\"a\" \"b\"")) 3)))
