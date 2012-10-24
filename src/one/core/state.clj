(ns one.core.state
  (:refer-clojure :exclude [get set eval])
  (:require [one.core.monad :as monad]
            [one.core.id :as id]
            [one.core.lens :as lens])
  (:use;*CLJSBUILD-REMOVE*;-macros
   [one.core.macros :only [for-m]]))

(deftype S [state value])

(deftype State [function]
  monad/Monadic
  (fmap [s g]
    (State. (fn [s]
              (let [s' (function s)]
                (S. (.state s') (g (.value s')))))))
  (bind [s g]
    (State. (fn [s]
              (let [s' (function s)]
                ((.function (g (.value s'))) (.state s')))))))

(defn get [lens]
  (State. (fn [state]
            (S. state (lens/get lens state)))))

(defn set [lens state']
  (State. (fn [state]
            (S. (lens/set lens state' state) state'))))

(defn modify [lens f]
  (for-m [x (get lens)
          y (id/->Id (f x))
          _ (set lens y)]
         y))

(defn run [state s]
  ((.function state) s))

(def eval (comp #(.value %) run))

(def exec (comp #(.state %) run))
