(ns one.test.lisp
  (:require [one.test :as test]
            [one.core.lisp :as lisp])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defspec literal
  (fn [x] (lisp/eval' x))
  [^test/literal x]
  (is (= % x)))

(defspec divergence
  (fn [b t f] (lisp/eval' (list 'if b t f)))
  [^boolean b ^test/literal t ^test/literal f]
  (is (= % (if b t f))))

(defspec quotation
  (fn [x] (lisp/eval' (list 'quote x)))
  [^test/literal x]
  (is (= % x)))

(defspec function-serial-definition-variable
  (fn [sym sym' x]
    (lisp/eval' (list 'do
                      (list 'def sym (list 'fn [sym'] sym'))
                      (list sym x))))
  [^test/symbol sym ^test/symbol sym' ^test/literal x]
  (is (= % x)))
