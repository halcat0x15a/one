(ns one.core.lens
  (:refer-clojure :exclude [get set]))

(defprotocol Lens
  (get [this obj])
  (set [this value obj]))

(defn modify [lens f obj]
  (set lens (f (get lens obj)) obj))

(defn compose [lens lens']
  (reify Lens
    (get [this obj]
      (->> obj
           (get lens')
           (get lens)))
    (set [this value obj]
      (modify lens' (partial set lens value) obj))))

(defn associative [key]
  (reify Lens
    (get [this obj]
      (key obj))
    (set [this value obj]
      (assoc obj key value))))

(comment
(defn editor-lens [key]
  (reify Lens
    (get [this editor] (get editor key))
    (set [this value editor]
      (assoc editor key value))))

(defn lens [key lens]
  (reify Lens
    (get [this editor]
      (clojure.core/get (get lens editor) key))
    (set [this value editor]
      (modify lens #(assoc % key value) editor))))

(def buffers (editor-lens :buffers))

(def minibuffer (editor-lens :minibuffer))

(def current-buffer (editor-lens :current))

(def view (editor-lens :view))

(def command (lens-lens :command minibuffer))

(def history (editor-lens :history))

(def commands (lens-lens :commands history))

(def current-command (lens-lens :current history))

(def history-cursor (lens-lens :cursor history))

(def buffer
  (reify Lens
    (lens-get [this editor]
      (let [current (:current editor)]
        (case current
          :minibuffer (current editor)
          (current (:buffers editor)))))
    (lens-set [this buffer editor]
      (let [current (:current editor)]
        (case current
          :minibuffer (assoc editor :minibuffer buffer)
          (assoc editor
            :buffers (assoc (:buffers editor)
                       current buffer)))))))

(def cursor (lens-lens :cursor buffer))

(def cursor-x (lens-lens :x cursor))

(def cursor-y (lens-lens :y cursor))

(def text (lens-lens :text buffer))

(defn line [y]
  (lens-lens y text))
)