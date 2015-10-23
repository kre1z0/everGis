(function() {

    sGis.spatialProcessor.Template = function(asset, path) {
        this.id = asset.Id || utils.getGuid();
        this.path = path;
        this.geometryType = asset.ServerBuilder ? asset.GeometryType - 1 : asset.GeometryType;
        this.symbol = this._getSymbol(asset.JsonVisualDefinition);
        this.layerReference = asset.Meta;
        this.name = asset.Name;

        this._asset = asset;
    };

    sGis.spatialProcessor.Template.prototype = {
        getImage: function(w, h) {
            w = w || 30;
            h = h || 30;
            if (this.symbol) {
                var tempFeature;
                if (this.symbol.type === 'point') {
                    tempFeature = new sGis.feature.Point([0, 0], {crs: sGis.CRS.plain});
                } else {
                    var type = this.symbol.type === 'polyline' ? sGis.feature.Polyline : sGis.feature.Polygon;
                    tempFeature = new type([[-w/2, -h/2], [0, h/2], [w/2, 0]], {crs: sGis.CRS.plain});
                }

                tempFeature.symbol = this.symbol;
                var render = tempFeature.render(1, sGis.CRS.plain);
                if (render && render[0]) {
                    if (render instanceof sGis.geom.Point || render instanceof sGis.geom.Polyline) {
                        return render[0].svg;
                    } else {
                        return render[0].node;
                    }
                }
            }
        },

        _getSymbol: function(visualDefinition) {
            if (visualDefinition) {
                var object = sGis.spatialProcessor.parseXML(visualDefinition);
                var keys = Object.keys(object.visualDefinitions);
                var key = keys[0];
                var symbolDefinition = object.symbol[key];
                var symbolId = object.visualDefinitions[key];

                var symbol;
                if (symbolDefinition.symbol === 'SimplePointSymbol') {
                    if (symbolDefinition.shape === 'Circle') {
                        symbol = new sGis.symbol.point.Point({
                            size: parseFloat(symbolDefinition.size),
                            color: parseColor(symbolDefinition.fill),
                            strokeColor: parseColor(symbolDefinition.stroke),
                            strokeWidth: parseFloat(symbolDefinition.strokeThickness)
                        });
                    } else {
                        symbol = new sGis.symbol.point.Square({
                            size: parseFloat(symbolDefinition.size),
                            fillColor: parseColor(symbolDefinition.fill),
                            strokeColor: parseColor(symbolDefinition.stroke),
                            strokeWidth: parseFloat(symbolDefinition.strokeThickness)
                        }); //todo: what about offset?!!
                    }
                } else if (symbolDefinition.symbol === 'ImagePointSymbol') {
                    symbol = new sGis.symbol.point.Image({
                        source: symbolDefinition.imageSrc,
                        size: parseFloat(symbolDefinition.size),
                        anchorPoint: symbolDefinition.anchorPoint
                    });
                } else if (symbolDefinition.symbol === 'SimplePolylineSymbol') {
                    symbol = new sGis.symbol.polyline.Simple({
                        strokeWidth: parseFloat(symbolDefinition.strokeThickness),
                        strokeColor: parseColor(symbolDefinition.stroke)
                    });
                } else if (symbolDefinition.symbol === 'SimplePolygonSymbol') {
                    if (symbolDefinition.fill && symbolDefinition.fill.brush) {
                        symbol = new sGis.symbol.polygon.BrushFill({
                            strokeWidth: parseFloat(symbolDefinition.strokeThickness),
                            strokeColor: parseColor(symbolDefinition.stroke),
                            fillBrush: symbolDefinition.fill.brush,
                            fillForeground: parseColor(symbolDefinition.fill.foreground),
                            fillBackground: parseColor(symbolDefinition.fill.background)
                        });
                    } else {
                        symbol = new sGis.symbol.polygon.Simple({
                            strokeWidth: parseFloat(symbolDefinition.strokeThickness),
                            strokeColor: parseColor(symbolDefinition.stroke),
                            fillColor: parseColor(symbolDefinition.fill)
                        });
                    }
                }

            } else {
                symbol = defaultSymbols[this.geometryType];
            }

            return symbol;
        }
    };

    function parseColor(color) {
        if (color) {
            return new sGis.utils.Color(color).toString();
        }
    }

    sGis.utils.proto.setProperties(sGis.spatialProcessor.Template.prototype, {
        symbol: null,
        id: null,
        path: null,
        geometryType: null,
        layerReference: null
    });

    var defaultSymbols = [new sGis.symbol.point.Point(), new sGis.symbol.polyline.Simple(), new sGis.symbol.polygon.Simple()];

})();