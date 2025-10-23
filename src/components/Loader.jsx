import React from 'react';

const Loader = ({ text }) => (
    <div className="my-6 flex flex-col items-center justify-center">
        <div className="loader"></div>
        <p className="text-sm text-gray-500 mt-2">{text}</p>
    </div>
);

export default Loader;