(ns onedit.file)

(defn open [file]
  (let [reader (js/FileReader.)]
    (.readAsText reader file)))

(defn save [])
