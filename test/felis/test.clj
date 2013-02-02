(ns felis.test
  (:refer-clojure :exclude [empty])
  (:require [clojure.data.generators :as gen]
            [felis.collection :as collection]
            [felis.text :as text]
            [felis.buffer :as buffer]
            [felis.group :as group]
            [felis.empty :as empty]
            [felis.editor.vim :as vim]))

(defn left []
  (collection/->Left (gen/string)))

(defn right []
  (collection/->Right (gen/string)))

(defn text []
  (text/->Text (left) (right)))

(defn outer []
  (text/->Outer (text)))

(defn top []
  (collection/->Top (gen/vec outer)))

(defn bottom []
  (collection/->Bottom (into '() (gen/list outer))))

(defn inner []
  (text/->Inner (text)))

(defn collection []
  (gen/rand-nth [(left) (right) (top) (bottom)]))

(defn buffer []
  (buffer/->Buffer (gen/keyword) (inner) (top) (bottom)))

(defn edit []
  (gen/rand-nth [(text) (buffer)]))

(defn minibuffer []
  (text/->Minibuffer (text)))

(defn group []
  (group/->Group (buffer) (minibuffer)))

(defn node []
  (rand-nth [(group) (buffer) (minibuffer) (inner)]))

(defn editor []
  (gen/rand-nth [(vim/->Normal (group))]))

(defn field []
  (gen/rand-nth [:lefts :rights]))

(defn serializable []
  (letfn [(text [] (assoc (empty/empty felis.text.Text) :rights (right)))]
    (gen/rand-nth [(text) (assoc (empty/empty felis.buffer.Buffer)
                            :focus (text/->Inner (text))
                            :rights (collection/->Right (into '() (gen/list (partial text/->Outer (text))))))])))

(defn empty []
  (gen/rand-nth [(edit) (collection)]))

(defprotocol Container
  (element [edit]))

(extend-protocol Container
  felis.buffer.Buffer
  (element [edit] (outer))
  felis.text.Text
  (element [edit] (gen/char)))
