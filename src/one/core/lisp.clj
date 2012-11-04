(ns one.core.lisp
  (:refer-clojure :exclude [eval])
  (:require [one.core.monad :as monad])
  (:use
   [one.core.macros :only [do-m]]))

(defprotocol Result
  (value [this]))

(deftype Success [env v]
  Result
  (value [this] v)
  monad/Monadic
  (fmap [this f]
    (Success. env (f v)))
  (bind [this f]
    (f v)))

(deftype Nothing []
  Result
  (value [this]
    (throw (Exception. "Unknown")))
  monad/Monadic
  (fmap [this f] this)
  (bind [this f] this))

(deftype Failure [message]
  Result
  (value [this] message)
  monad/Monadic
  (fmap [this f] this)
  (bind [this f] this))

(def success? (partial instance? Success))

(defn null [env]
  (Success. env nil))

(def nothing (Nothing.))

(defn few-args [s]
  (Failure. (str "Too few arguments to " s)))

(defn many-args [s]
  (Failure. (str "Too many arguments to " s)))

(defn unresolve-symbol [s]
  (Failure. (str "Unable to resolve symbol: " s " in this context")))

(defn wrong-args [n s]
  (Failure. (str "Wrong number of args (" n ") passed to")))

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
  (Evaluator. literal? ->Success))

(def variable
  (Evaluator. symbol?
    (fn [env exp]
      (if (contains? env exp)
        (Success. env (env exp))
        (unresolve-symbol exp)))))

(defn tagged? [tag exp]
  (and (seq? exp)
       (-> exp empty? not)
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
      (Success. env (first exp)))))

(def definition
  (Special. 'def
    (fn [env exp]
      (let [arity (count exp)]
        (cond (zero? arity) (few-args 'def)
              (> arity 2) (many-args 'def)
              :else (let [value (second exp)]
                      (Success. (assoc env (first exp) value) value)))))))

(defprotocol Procedure
  (run [this f args]))

(deftype Compound [env params body]
  Procedure
  (run [this f args]
    (let [arity (count args)]
      (if (= arity (count params))
        (f (merge env (interleave params args)) body)
        (wrong-args arity)))))

(deftype Primitive [f])

(def function
  (Special. 'fn
    (fn [env exp]
      (let [arity (count exp)]
        (cond (< arity 1) (few-args 'fn)
              (> arity 2) (many-args 'fn)
              (zero? arity) (null env)
              :else (Success. env (Compound. env (first exp) (second exp))))))))

(defn divergence [f]
  (Special. 'if
    (fn [env exp]
      (let [arity (count exp)]
        (cond (< arity 2) (few-args 'if)
              (> arity 3) (many-args 'if)
              :else (monad/bind (->> exp first (f env))
                                (fn [b]
                                  (if b
                                    (->> exp second (f env))
                                    (if (= arity 3)
                                      (f env (nth exp 2))
                                      (null env))))))))))

(defn serial [f]
  (Special. 'do
    (fn [env exp]
      (case (count exp)
        0 (null env)
        1 (f env (first exp))
        (let [result (f env (first exp))]
          (if (success? result)
            (recur (.env result) (rest exp))
            result))))))

(defn application [f]
  (Evaluator. (fn [exp]
                (and (seq? exp)
                     (-> exp empty? not)))
              (fn [env exp]
                (do-m [p (f env (first exp))
                       args (monad/sequence (map (partial f env) (rest exp)))]
                      (run p f args)))))

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
  (let [eval (fn [env exp] (eval lisp env exp))]
    (compose literal
             variable
             quotation
             definition
             (divergence eval)
             (serial eval)
             function
             (application eval))))

(def eval'
  (comp value (partial eval lisp {})))
