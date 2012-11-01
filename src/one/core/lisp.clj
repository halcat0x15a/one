(ns one.core.lisp
  (:refer-clojure :exclude [eval]))

(declare lisp)

(deftype Nothing [])

(def nothing (Nothing.))

(defn few-args [s]
  (throw (Exception. (str "Too few arguments to " s))))

(defn many-args [s]
  (throw (Exception. (str "Too many arguments to " s))))

(defprotocol Eval
  (eval [this env exp]))

(defn literal? [exp]
  (or (true? exp)
      (false? exp)
      (nil? exp)
      (number? exp)
      (string? exp)))

(def literal
  (reify Eval
    (eval [this env exp]
      (if (literal? exp)
        exp
        nothing))))

(def variable
  (reify Eval
    (eval [this env exp]
      (if (symbol? exp)
        (if-let [result (get env exp)]
          result
          (throw
           (Exception. (str "Unable to resolve symbol: " exp " in this context"))))
        nothing))))

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
      (first exp))))

(def definition
  (Special. 'def
    (fn [env exp]
      (if-let [name (first exp)]
        (assoc! env name (second exp))
        (few-args 'def)))))

(def function
  (Special. 'fn
    (fn [env exp])))

(defn divergence [f]
  (Special. 'if
    (fn [env exp]
      (case (count exp)
        0 (few-args 'if)
        1 (few-args 'if)
        2 (when (->> exp first (f env))
            (f env (nth exp 1)))
        3 (if (->> exp first (f env))
            (f env (nth exp 1))
            (f env (nth exp 2)))
        (many-args 'if)))))

(defn serial [f]
  (Special. 'do
    (fn [env exp]
      (let [exps (rest exp)]
        (case (count exps)
          0 nil
          1 (f env (first exps))
          (do
            (f env (first exps))
            (recur env (list 'do (rest exps)))))))))

(defn compose [e & es]
  (if (empty? es)
    e
    (apply compose
           (reify Eval
             (eval [this env exp]
               (let [result (eval e env exp)]
                 (if (= result nothing)
                   (-> es first (eval env exp))
                   result))))
           (rest es))))

(def lisp
  (let [eval (fn [env exp] (eval lisp env exp))]
    (compose literal
             variable
             quotation
             definition
             (divergence eval))))

(def eval' (partial eval lisp  (transient {})))
