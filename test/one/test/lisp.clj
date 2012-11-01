(ns one.test.lisp
  (:require [one.test :as test]
            [one.core.lisp :as lisp])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defspec literal
  (fn [x] (lisp/eval lisp/lisp {} x))
  [^test/literal x]
  (is (= % x)))

(defspec divergence
  (fn [b t f] (lisp/eval lisp/lisp {} (list 'if b t f)))
  [^boolean b ^test/literal t ^test/literal f]
  (is (= % (if b t f))))

(defspec quote
  (fn [x] (lisp/eval lisp/lisp {} (list 'quote x)))
  [^test/literal x]
  (is (= % x)))
