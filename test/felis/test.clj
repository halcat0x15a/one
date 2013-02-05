(ns felis.test
  (:refer-clojure :exclude [list empty])
  (:require [clojure.data.generators :as gen]
            [felis.text :as text]
            [felis.minibuffer :as minibuffer]
            [felis.buffer :as buffer]
            [felis.group :as group]
            [felis.empty :as empty]
            [felis.editor.normal :as normal]))

(defn list [f]
  (into '() (gen/list f)))

(defn text []
  (text/->Text (gen/string) (gen/string)))

(defn minibuffer []
  (minibuffer/->Minibuffer (text) {}))

(defn top []
  (gen/vec text))

(defn bottom []
  (list text))

(defn collection []
  (gen/rand-nth [(list gen/anything) (gen/vec gen/anything)]))

(defn buffer []
  (buffer/->Buffer (gen/keyword) (text) (top) (bottom)))

(defn edit []
  (gen/rand-nth [(text) (buffer)]))

(defn group []
  (group/->Group (buffer) (minibuffer)))

(defn node []
  (rand-nth [(group) (buffer) (minibuffer) (text)]))

(defn editor []
  (gen/rand-nth [(normal/->Normal (group))]))

(defn field []
  (gen/rand-nth [:lefts :rights]))

(defn serializable []
  (letfn [(text [] (assoc text/empty :rights (gen/string)))]
    (gen/rand-nth [(text) (assoc buffer/empty
                            :focus (text)
                            :rights (list (text)))])))

(defprotocol Container
  (element [edit]))

(extend-protocol Container
  felis.buffer.Buffer
  (element [edit] (text))
  felis.text.Text
  (element [edit] (gen/char)))

(defn collection*element []
  (let [coll (collection)]
    [coll (element coll)]))
