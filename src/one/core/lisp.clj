(ns one.core.lisp
  (:refer-clojure :exclude [eval])
  (:require [one.core.monad :as monad])
  (:use
   [one.core.macros :only [do-m]]))

(def nothing (Object.))

(defn few-args [s]
  (throw (Exception. (str "Too few arguments to " s))))

(defn many-args [s]
  (throw (Exception. (str "Too many arguments to " s))))

(defn unresolve-symbol [s]
  (throw (Exception. (str "Unable to resolve symbol: " s " in this context"))))

(defn wrong-args [n s]
  (throw (Exception. (str "Wrong number of args (" n ") passed to"))))

(defprotocol Eval
  (eval [this env exp]))

(defn literal? [exp]
  (or (true? exp)
      (false? exp)
      (nil? exp)
      (number? exp)
      (string? exp)))

(deftype Evaluator [pred f]
  Eval
  (eval [this env exp]
    (if (pred exp)
      (f env exp)
      nothing)))

(def literal
  (Evaluator. literal?
              (fn [env exp] exp)))

(def variable
  (letfn [(lookup [env exp]
            (if (contains? @env exp)
              (get @env exp)
              (unresolve-symbol exp)))]
    (Evaluator. symbol? lookup)))

(defn pair? [exp]
  (and (seq? exp)
       (-> exp empty? not)))

(defn tagged? [tag exp]
  (and (pair? exp)
       (-> exp first (= tag))))

(deftype Special [tag f]
  Eval
  (eval [this env exp]
    (if (tagged? tag exp)
      (f env (rest exp))
      nothing)))

(def quotation
  (Special. 'quote
            (fn [env exp]
              (first exp))))

(defn definition [f]
  (letfn [(define [env exp]
            (let [arity (count exp)]
              (cond (zero? arity) (few-args 'def)
                    (> arity 2) (many-args 'def)
                    :else (swap! env #(assoc %
                                        (first exp) (->> exp second (f env)))))))]
    (Special. 'def define)))

(defprotocol Procedure
  (call [this f args]))

(deftype Lambda [env params body]
  Procedure
  (call [this f args]
    (let [arity (count args)]
      (if (= arity (count params))
        (f (atom (merge @env (vec (interleave params args)))) body)
        (wrong-args arity)))))

(def function
  (Special. 'fn
    (fn [env exp]
      (let [arity (count exp)]
        (cond (< arity 1) (few-args 'fn)
              (> arity 2) (many-args 'fn)
              :else (Lambda. env (first exp) (second exp)))))))

(defn divergence [f]
  (letfn [(select [env exp]
            (let [arity (count exp)]
              (cond (< arity 3) (few-args 'if)
                    (> arity 3) (many-args 'if)
                    :else (if (->> exp first (f env))
                            (->> exp second (f env))
                            (f env (nth exp 2))))))]
    (Special. 'if select)))

(defn serial [f]
  (letfn [(run [env exp]
            (case (count exp)
              0 (few-args 'do)
              1 (f env (first exp))
              (do
                (f env (first exp))
                (recur env (rest exp)))))]
    (Special. 'do run)))

(defn application [e]
  (letfn [(run [env exp]
            (let [f (e env (first exp))
                  args (map (partial e env) (rest exp))]
              (cond (fn? f) (apply f args)
                    :else (call f e args))))]
    (Evaluator. pair? run)))

(defn compose [e & es]
  (reduce (fn [e e']
            (reify Eval
              (eval [this env exp]
                (let [result (eval e env exp)]
                  (if (= result nothing)
                    (eval e' env exp)
                    result)))))
          e
          es))

(def lisp
  (let [eval (fn [env exp]
               (eval lisp env exp))]
    (compose literal
             variable
             quotation
             (definition eval)
             (divergence eval)
             (serial eval)
             function
             (application eval))))

(def specials
  '(def do fn quote if))

(def primitives
  {'+ +
   '- -
   '* *
   '/ /})

(defn eval' [exp]
  (eval lisp (atom primitives) exp))
