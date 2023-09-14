import itertools
from bson import ObjectId
from flask import Flask, render_template, jsonify, url_for, request
from pymongo import MongoClient
import spacy
import json
from spacy.tokens import DocBin

app = Flask(__name__)
mongoclient = MongoClient("mongodb://localhost:27017")

db = mongoclient["test"]
ents = db["entities"]

nlp = spacy.blank("en")


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/td/<int:index>")
def get_td(index):
    td = ents.find({"docbin":False}).skip(index).limit(1)
    td = list(td)[0]
    
    if "_id" in td:
        td['_id'] = str(td['_id'])
    return td

@app.route("/tdbrokencount/")
def get_tdbrokencount():
    cnt = ents.count_documents({"docbin":False})
    return {"count":cnt}

@app.route("/tdfixedcount/")
def get_tdfixedcount():
    cnt = ents.count_documents({"fixed":True})
    return {"count":cnt}

@app.route("/removeent/", methods=["GET","POST"])
def remove_ent():
    data = request.get_json()
    ent = data["ent"]
    id = data["id"]
    res = ents.update_one({"_id":ObjectId(id)},{"$pull":{"entities":ent}})
    # print(res)
    return {"res":res.modified_count}

def validatetd(ent):
    dbin = DocBin()
    if "text" in ent:
        text = ent["text"]
    else:        
        return False
    if "entities" in ent:    
        entlist = ent["entities"]
    else:
        return False

    if len(entlist)==0: #means no entities marked
        return False

    entlist.sort()
    unique_entities = [ent for ent,_ in itertools.groupby(entlist) ]
    doc = nlp.make_doc(text)
    valid_ents = []
    try:
        for start, end, label in unique_entities:
            span = doc.char_span(start,end,label=label,alignment_mode="contract")            
            if span is None:# or span.text.startswith(" ") or span.text.endswith(" ") :
                return False
            else:                
                valid_ents.append(span)
        doc.ents = valid_ents
        dbin.add(doc)
        return True
    except Exception as ex:
        return False
    

@app.route("/td/validate", methods=["GET","POST"])
def validate():
    data = request.get_json()    
    id = data["id"]
    res = ents.find_one({"_id":ObjectId(id)},{"_id":0})
    # print(res)
    isvalid = validatetd(res)

    return {"valid":isvalid}


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('images/favicon.png')

if __name__ == "__main__":
    app.run(debug=True, port=8080)