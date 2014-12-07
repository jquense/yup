'use strict';
module.exports = ValidationResult;

function ValidationResult(valid, error){
	this.isValid = valid;
	this.errors = valid ? error : [];
}